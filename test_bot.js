const puppeteer = require('puppeteer');

(async () => {
  console.log('Iniciando Puppeteer para bot alumno_orq_01...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--mute-audio'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  console.log('1. Accediendo a wp-login.php...');
  await page.goto('https://creamosia.com/wp-login.php', { waitUntil: 'networkidle2' });

  await page.type('#user_login', 'alumno_orq_01');
  await page.type('#user_pass', 'AlumnoOrq2026!01');

  console.log('2. Enviando formulario de login...');
  await Promise.all([
    page.click('#wp-submit'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  console.log('URL actual tras login:', page.url());

  const cookies = await page.cookies();
  console.log('Cookies obtenidas:', cookies.map(c => c.name));

  console.log('3. Navegando a la sesión 17067...');
  await page.goto('https://creamosia.com/aula-virtual/?sesion_id=17067', { waitUntil: 'networkidle2' });

  const btnEntrar = await page.$('#gc-entrar-sala');
  console.log('¿Existe botón Entrar a la sala?:', !!btnEntrar);

  if (btnEntrar) {
    console.log('4. Haciendo clic en "Entrar a la sala"...');
    await btnEntrar.click();
    await new Promise(r => setTimeout(r, 5000));
    console.log('✅ ¡Bot Alumno 01 conectado exitosamente a Jitsi!');
  } else {
    const text = await page.evaluate(() => document.body.innerText);
    console.log('Contenido de la página:\n', text.substring(0, 400));
  }

  await browser.close();
  console.log('Fin de la prueba.');
})();
