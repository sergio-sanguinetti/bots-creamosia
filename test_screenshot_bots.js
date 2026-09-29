const puppeteer = require('puppeteer');

(async () => {
  console.log('--- TOMANDO CAPTURAS DE PANTALLA EN JITSI ---');

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

    console.log(`[Bot ${num}] Login como ${login}...`);
    await page.goto('https://creamosia.com/wp-login.php', { waitUntil: 'networkidle2' });
    await page.type('#user_login', login);
    await page.type('#user_pass', pass);
    await Promise.all([
      page.click('#wp-submit'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    console.log(`[Bot ${num}] Navegando al Aula Virtual...`);
    await page.goto('https://creamosia.com/aula-virtual/?sesion_id=17067', { waitUntil: 'networkidle2' });

    const btnEntrar = await page.$('#gc-entrar-sala');
    if (btnEntrar) {
      await btnEntrar.click();
    }
    return { browser, page };
  };

  const bot1 = await launchBot('01', 'alumno_orq_01', 'AlumnoOrq2026!01');
  await new Promise(r => setTimeout(r, 4000));

  const bot2 = await launchBot('02', 'alumno_orq_02', 'AlumnoOrq2026!02');
  await new Promise(r => setTimeout(r, 10000));

  const shot1 = 'c:\\Users\\sergi\\Documents\\PROYECTOS WORKANA\\LoDigitalizo\\bot1_jitsi.png';
  const shot2 = 'c:\\Users\\sergi\\Documents\\PROYECTOS WORKANA\\LoDigitalizo\\bot2_jitsi.png';

  await bot1.page.screenshot({ path: shot1, fullPage: true });
  await bot2.page.screenshot({ path: shot2, fullPage: true });

  console.log('Capturas guardadas:');
  console.log('Bot 1:', shot1);
  console.log('Bot 2:', shot2);

  // Consultar estado de la conferencia en el frame Jitsi
  const frame1 = bot1.page.frames().find(f => f.url().includes('aula.creamosia.com'));
  if (frame1) {
    const state1 = await frame1.evaluate(() => {
      try {
        const store = window.APP.store.getState();
        const parts = Object.values(store['features/base/participants'] || {}).map(p => p.name);
        return { room: store['features/base/conference'].room, participants: parts };
      } catch (e) {
        return e.message;
      }
    });
    console.log('Estado Conferencia en Bot 1:', JSON.stringify(state1, null, 2));
  }

  await bot1.browser.close();
  await bot2.browser.close();
})();
