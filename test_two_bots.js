const puppeteer = require('puppeteer');

(async () => {
  console.log('--- TEST DE DOS BOTS EN LA MISMA SALA ---');

  const launchBot = async (num, login, pass) => {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--mute-audio',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    page.on('console', msg => {
      const txt = msg.text();
      if (txt.includes('participant') || txt.includes('JOINED') || txt.includes('LEFT') || txt.includes('error') || txt.includes('Error')) {
        console.log(`[Bot ${num} LOG]:`, txt);
      }
    });

    console.log(`[Bot ${num}] 1. Login en WordPress como ${login}...`);
    await page.goto('https://creamosia.com/wp-login.php', { waitUntil: 'networkidle2' });
    await page.type('#user_login', login);
    await page.type('#user_pass', pass);
    await Promise.all([
      page.click('#wp-submit'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    console.log(`[Bot ${num}] 2. Navegando al Aula Virtual 17067...`);
    await page.goto('https://creamosia.com/aula-virtual/?sesion_id=17067', { waitUntil: 'networkidle2' });

    const btnEntrar = await page.$('#gc-entrar-sala');
    if (btnEntrar) {
      console.log(`[Bot ${num}] 3. Clic en "Entrar a la sala"...`);
      await btnEntrar.click();
    }

    return { browser, page };
  };

  const bot1 = await launchBot('01', 'alumno_orq_01', 'AlumnoOrq2026!01');
  await new Promise(r => setTimeout(r, 5000));

  const bot2 = await launchBot('02', 'alumno_orq_02', 'AlumnoOrq2026!02');
  await new Promise(r => setTimeout(r, 10000));

  console.log('--- Verificando participantes en Bot 1 ---');
  const frame1 = bot1.page.frames().find(f => f.url().includes('aula.creamosia.com'));
  if (frame1) {
    const participants1 = await frame1.evaluate(() => {
      if (window.APP && window.APP.conference) {
        return window.APP.conference.getMembers().map(m => ({ id: m._id, name: m._displayName }));
      }
      return 'APP.conference no disponible';
    }).catch(e => e.message);
    console.log('Participantes en Bot 1:', JSON.stringify(participants1));
  } else {
    console.log('Frame de Jitsi no encontrado en Bot 1');
  }

  console.log('--- Verificando participantes en Bot 2 ---');
  const frame2 = bot2.page.frames().find(f => f.url().includes('aula.creamosia.com'));
  if (frame2) {
    const participants2 = await frame2.evaluate(() => {
      if (window.APP && window.APP.conference) {
        return window.APP.conference.getMembers().map(m => ({ id: m._id, name: m._displayName }));
      }
      return 'APP.conference no disponible';
    }).catch(e => e.message);
    console.log('Participantes en Bot 2:', JSON.stringify(participants2));
  } else {
    console.log('Frame de Jitsi no encontrado en Bot 2');
  }

  await bot1.browser.close();
  await bot2.browser.close();
  console.log('--- FIN TEST ---');
})();
