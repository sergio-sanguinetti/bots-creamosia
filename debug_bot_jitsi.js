const puppeteer = require('puppeteer');

(async () => {
  console.log('--- INICIANDO DIAGNÓSTICO DE BOT ---');
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

  // Escuchar logs del navegador
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  console.log('1. Login en WordPress...');
  await page.goto('https://creamosia.com/wp-login.php', { waitUntil: 'networkidle2' });
  await page.type('#user_login', 'alumno_orq_02');
  await page.type('#user_pass', 'AlumnoOrq2026!02');
  await Promise.all([
    page.click('#wp-submit'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  console.log('2. Navegando al Aula Virtual (sesion 17067)...');
  await page.goto('https://creamosia.com/aula-virtual/?sesion_id=17067', { waitUntil: 'networkidle2' });

  const btnEntrar = await page.$('#gc-entrar-sala');
  console.log('¿Existe #gc-entrar-sala?:', !!btnEntrar);

  if (btnEntrar) {
    console.log('3. Haciendo clic en "Entrar a la sala"...');
    await btnEntrar.click();
    console.log('Esperando 10 segundos a que cargue Jitsi...');
    await new Promise(r => setTimeout(r, 10000));
  }

  // Tomar captura de pantalla para ver exactamente qué ve el bot
  const screenshotPath = 'c:\\Users\\sergi\\Documents\\PROYECTOS WORKANA\\LoDigitalizo\\bot_debug.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Captura guardada en:', screenshotPath);

  // Verificar si hay iframe de Jitsi
  const iframes = await page.$$('iframe');
  console.log('Número de iframes encontrados:', iframes.length);
  for (let i = 0; i < iframes.length; i++) {
    const src = await page.evaluate(el => el.src, iframes[i]);
    console.log(`Iframe ${i}:`, src);
  }

  await browser.close();
  console.log('--- FIN DIAGNÓSTICO ---');
})();
