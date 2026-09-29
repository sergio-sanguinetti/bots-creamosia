const puppeteer = require('puppeteer');

const BOTS_DATA = [];
for (let i = 1; i <= 15; i++) {
  const num = String(i).padStart(2, '0');
  BOTS_DATA.push({
    num: num,
    login: `alumno_orq_${num}`,
    pass: `AlumnoOrq2026!${num}`,
    name: `Alumno Orquestacion ${num}`,
    dni: `123456${num}A`
  });
}

const SESION_URL = 'https://creamosia.com/aula-virtual/?sesion_id=17067';
const DURATION_MINUTES = 10; // Duración de la prueba en minutos

async function launchSingleBot(botInfo, index) {
  // Retardo de entrada escalonada (2 segundos entre cada bot)
  const delayMs = index * 2000;
  await new Promise(r => setTimeout(r, delayMs));

  console.log(`[Bot ${botInfo.num}] 🚀 Iniciando sesión para ${botInfo.name} (${botInfo.login})...`);

  let browser = null;
  try {
    browser = await puppeteer.launch({
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
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 1. Login en WordPress
    await page.goto('https://creamosia.com/wp-login.php', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('#user_login', botInfo.login);
    await page.type('#user_pass', botInfo.pass);

    await Promise.all([
      page.click('#wp-submit'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);

    // 2. Navegar al Aula Virtual de la Sesión
    await page.goto(SESION_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // 3. Clic en "Entrar a la sala"
    const btnEntrar = await page.$('#gc-entrar-sala');
    if (btnEntrar) {
      await btnEntrar.click();
      console.log(`[Bot ${botInfo.num}] ✅ Unió a la sala Jitsi con éxito.`);
    } else {
      console.log(`[Bot ${botInfo.num}] ⚠️ Botón de sala no encontrado, verificando sesión...`);
    }

    // Mantener la sesión activa en segundo plano
    const keepAliveMs = DURATION_MINUTES * 60 * 1000;
    console.log(`[Bot ${botInfo.num}] ⏳ Manteniéndose activo por ${DURATION_MINUTES} minutos...`);
    await new Promise(r => setTimeout(r, keepAliveMs));

  } catch (err) {
    console.error(`[Bot ${botInfo.num}] ❌ Error:`, err.message);
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) {}
      console.log(`[Bot ${botInfo.num}] 🛑 Desconectado.`);
    }
  }
}

async function runOrchestration() {
  console.log('================================================================');
  console.log(`🤖 INICIANDO ORQUESTACIÓN DE 15 BOTS EN AULA VIRTUAL`);
  console.log(`📍 Sesión: ${SESION_URL}`);
  console.log(`⏱️ Duración asignada: ${DURATION_MINUTES} minutos`);
  console.log('================================================================\n');

  const promises = BOTS_DATA.map((bot, idx) => launchSingleBot(bot, idx));
  await Promise.all(promises);

  console.log('\n✅ Orquestación finalizada exitosamente para todos los bots.');
}

runOrchestration();
