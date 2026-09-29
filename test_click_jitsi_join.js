const puppeteer = require('puppeteer');

(async () => {
  console.log('--- TEST: HACIENDO CLIC EN JOIN MEETING DENTRO DEL IFRAME ---');

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

  console.log('1. Login como alumno_orq_01...');
  await page.goto('https://creamosia.com/wp-login.php', { waitUntil: 'networkidle2' });
  await page.type('#user_login', 'alumno_orq_01');
  await page.type('#user_pass', 'AlumnoOrq2026!01');
  await Promise.all([
    page.click('#wp-submit'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  console.log('2. Navegando al Aula Virtual...');
  await page.goto('https://creamosia.com/aula-virtual/?sesion_id=17067', { waitUntil: 'networkidle2' });

  const btnEntrarWP = await page.$('#gc-entrar-sala');
  if (btnEntrarWP) {
    console.log('3. Clic en "Entrar a la sala" de WordPress...');
    await btnEntrarWP.click();
    await new Promise(r => setTimeout(r, 4000));
  }

  console.log('4. Buscando el iframe de Jitsi...');
  const frame = page.frames().find(f => f.url().includes('aula.creamosia.com'));
  if (frame) {
    console.log('Iframe encontrado:', frame.url());

    // Esperar y hacer clic en el botón "Join meeting" dentro del iframe de Jitsi
    try {
      const joinSelectors = [
        'button[aria-label*="Join"]',
        'div[role="button"][aria-label*="Join"]',
        '.action-btn',
        'button'
      ];

      let clicked = false;
      for (const sel of joinSelectors) {
        const btns = await frame.$$(sel);
        for (const btn of btns) {
          const text = await frame.evaluate(el => el.innerText || el.ariaLabel || '', btn);
          if (text.toLowerCase().includes('join') || text.toLowerCase().includes('unirse')) {
            console.log(`¡Haciendo clic en botón Jitsi internal ("${text.trim()}")!`);
            await btn.click();
            clicked = true;
            break;
          }
        }
        if (clicked) break;
      }

      if (!clicked) {
        console.log('Haciendo clic en el primer botón del iframe por defecto...');
        const firstBtn = await frame.$('button');
        if (firstBtn) await firstBtn.click();
      }

      await new Promise(r => setTimeout(r, 5000));
      console.log('✅ Bot unido a la sala Jitsi.');

    } catch (e) {
      console.error('Error al hacer clic en el botón del iframe:', e.message);
    }
  } else {
    console.log('Iframe de Jitsi no encontrado.');
  }

  const shot = 'c:\\Users\\sergi\\Documents\\PROYECTOS WORKANA\\LoDigitalizo\\bot1_joined.png';
  await page.screenshot({ path: shot, fullPage: true });
  console.log('Captura guardada en:', shot);

  await browser.close();
})();
