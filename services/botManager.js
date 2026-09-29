const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('./dataStore');

function getChromiumExecutablePath() {
  let envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath) {
    envPath = envPath.trim();
    if (fs.existsSync(envPath)) return envPath;
    if (!envPath.startsWith('/') && fs.existsSync(`/${envPath}`)) return `/${envPath}`;
  }

  // Common Linux paths in Docker / Debian / Alpine
  const candidatePaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/snap/bin/chromium',
    '/usr/lib/chromium/chromium'
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }

  return undefined;
}

const USER_AGENTS_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

async function safeGoto(page, url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000, ...options });
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      console.warn(`[SafeGoto] Reintentando navegación a ${url} (intento ${attempt + 1}/${maxRetries}): ${err.message}`);
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

class BotManager {
  constructor() {
    this.activeInstances = new Map(); // botId -> { browser, page, timer }
  }

  async syncWordPressLogs(login, ipAddress, userAgent) {
    if (!login || !ipAddress) return;
    const safeIp = ipAddress.replace('Sin IP asignada', '').trim();
    if (!safeIp) return;

    try {
      const response = await fetch('https://creamosia.com/wp-json/orquestador/v1/update-bot-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Orquestador-Token': 'OrqBotSecret2026!',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({
          login,
          ip: safeIp,
          user_agent: userAgent
        })
      });
      const data = await response.json();
      if (data && data.success) {
        console.log(`[WP REST Sync] Updated IP (${safeIp}) and User-Agent in WordPress DB for ${login}`);
      } else {
        console.warn(`[WP REST Sync Warning] ${login}:`, data ? data.message : 'Sin respuesta');
      }
    } catch (err) {
      console.warn(`[WP REST Sync Error] ${login}:`, err.message);
    }
  }

  async launchBots({ employeeIds, jitsiUrl, durationMinutes = 30, staggeredDelay = true, autoMute = true }) {
    const activeBots = dataStore.getActiveBots();
    const activeEmployeeIds = new Set(activeBots.map(b => b.employeeId));

    const employees = dataStore.getEmployees().filter(e => employeeIds.includes(e.id) && !activeEmployeeIds.has(e.id));
    if (employees.length === 0) {
      throw new Error('Los empleados seleccionados ya cuentan con una sesión activa en la reunión.');
    }

    // Clean Jitsi URL
    let cleanUrl = jitsiUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const BATCH_SIZE = 3;
    const totalBatches = Math.ceil(employees.length / BATCH_SIZE);
    const launchedBots = [];

    // Pre-registrar todos los bots en estado 'scheduled' con información de su bloque
    for (let index = 0; index < employees.length; index++) {
      const employee = employees[index];
      const botId = `bot_${uuidv4().substring(0, 8)}`;
      const batchNum = Math.floor(index / BATCH_SIZE) + 1;

      // Auto-asignar IP si el empleado no tiene una asignada
      if (!employee.ipAddress || employee.ipAddress === 'Sin IP asignada') {
        const autoEmp = dataStore.autoAssignEmployeeIp(employee.id);
        if (autoEmp && autoEmp.ipAddress) {
          employee.ipAddress = autoEmp.ipAddress;
          employee.ipCity = autoEmp.ipCity;
          employee.ipRegion = autoEmp.ipRegion;
          employee.ipIsp = autoEmp.ipIsp;
        } else {
          employee.ipAddress = `138.100.1.${(index % 250) + 1}`;
          employee.ipCity = 'Madrid';
          employee.ipRegion = 'Comunidad de Madrid';
        }
      }

      const botRecord = {
        id: botId,
        employeeId: employee.id,
        employeeName: employee.name,
        companyName: employee.companyName,
        login: employee.login || null,
        pass: employee.pass || null,
        dni: employee.dni || null,
        ipAddress: employee.ipAddress,
        ipCity: employee.ipCity || 'Madrid',
        ipRegion: employee.ipRegion || 'Comunidad de Madrid',
        ipIsp: employee.ipIsp || 'Telefónica de España',
        jitsiUrl: cleanUrl,
        status: 'scheduled',
        batchNumber: batchNum,
        totalBatches: totalBatches,
        scheduledTime: new Date(),
        connectedAt: null,
        durationMinutes: parseInt(durationMinutes, 10) || 30,
        autoMute: true
      };

      dataStore.addBot(botRecord);
      launchedBots.push(botRecord);
    }

    // Procesar bloques de forma secuencial y asíncrona en segundo plano
    (async () => {
      console.log(`====================================================`);
      console.log(`🚀 [BotManager] Iniciando proceso por bloques: ${employees.length} bots en ${totalBatches} bloques (Tamaño: ${BATCH_SIZE})`);
      console.log(`====================================================`);

      for (let b = 0; b < totalBatches; b++) {
        const batchNum = b + 1;
        const startIdx = b * BATCH_SIZE;
        const endIdx = Math.min(startIdx + BATCH_SIZE, employees.length);
        const batchBots = launchedBots.slice(startIdx, endIdx);

        console.log(`\n📦 [Bloque ${batchNum}/${totalBatches}] Lanzando ${batchBots.length} bot(s): ${batchBots.map(bot => bot.employeeName).join(', ')}...`);

        // Lanzar los bots del bloque actual con breve separación interna (3.5s)
        const batchPromises = batchBots.map(async (botRecord, subIdx) => {
          if (subIdx > 0 && staggeredDelay) {
            await new Promise(r => setTimeout(r, subIdx * 3500));
          }
          return this.runPuppeteerBot(botRecord, cleanUrl, 1, batchNum, totalBatches);
        });

        // Esperar a que los bots del bloque confirmen su entrada en sala (o agoten intentos)
        await Promise.allSettled(batchPromises);

        console.log(`✅ [Bloque ${batchNum}/${totalBatches}] Finalizado el proceso de conexión.`);
        if (b < totalBatches - 1) {
          console.log(`⏳ Pausa de estabilización de 5 segundos antes del siguiente bloque...`);
          await new Promise(r => setTimeout(r, 5000));
        }
      }

      console.log(`\n🎉 [BotManager] Todos los ${totalBatches} bloques han sido procesados.`);
    })().catch(err => {
      console.error('[BotManager Batch Engine Error]:', err);
    });

    return launchedBots;
  }

  async runPuppeteerBot(botRecord, baseUrl, attemptCount = 1, batchNumber = 1, totalBatches = 1) {
    const maxAttempts = 3;
    const { id: botId, employeeId, employeeName, companyName, ipAddress, ipCity, durationMinutes, login: recordLogin, pass: recordPass, dni: recordDni } = botRecord;

    const batchTag = `[Bloque ${batchNumber}/${totalBatches}]`;
    dataStore.updateBotStatus(botId, 'connecting', { attempt: attemptCount, maxAttempts, batchNumber, totalBatches });

    if (attemptCount === 1 && ipAddress) {
      dataStore.addBotLog(botId, `${batchTag} Conectando (Intento 1/${maxAttempts}) con IP España: ${ipAddress} (${ipCity})`, 'info');
    } else {
      dataStore.addBotLog(botId, `${batchTag} Intento ${attemptCount}/${maxAttempts} de conexión...`, 'info');
    }

    let browser = null;
    let muteCheckInterval = null;
    let timer = null;

    try {
      // Build display name and URL hash flags for Jitsi Meet auto-join (Always muted audio & video)
      const displayNameParam = encodeURIComponent(`${employeeName} (${companyName})`);
      const fullJitsiUrl = `${baseUrl}#userInfo.displayName="${displayNameParam}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true&config.startSilent=true&config.channelLastN=0&config.resolution=72&config.disableSimulcast=true&config.disableRtx=true&config.disableAudioLevels=true&config.p2p.enabled=false&config.requireDisplayName=false`;

      const silenceWavPath = path.resolve(__dirname, '..', 'silence.wav');
      const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--renderer-process-limit=1',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-update',
        '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection',
        '--js-flags=--max-old-space-size=96',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--mute-audio',
        '--disable-notifications',
        '--disable-permissions-api',
        '--disable-web-security',
        '--autoplay-policy=no-user-gesture-required',
        '--window-size=800,600'
      ];

      // Feed 100% silent WAV audio file into fake microphone instead of default 440Hz test tone / beep
      if (fs.existsSync(silenceWavPath)) {
        launchArgs.push(`--use-file-for-fake-audio-capture=${silenceWavPath}`);
      }

      // Unique isolated browser profile per bot attempt to guarantee 0 lock/cookie collisions
      const botProfileDir = path.join(os.tmpdir(), `bot_profile_${botId}_${Date.now()}_${Math.floor(Math.random() * 10000)}`);

      const launchOptions = {
        headless: true,
        args: launchArgs,
        userDataDir: botProfileDir
      };

      const execPath = getChromiumExecutablePath();
      if (execPath) {
        launchOptions.executablePath = execPath;
      }

      browser = await puppeteer.launch(launchOptions);

      browser.on('disconnected', () => {
        console.warn(`[Bot ${botId}] Browser disconnected.`);
      });

      const page = await browser.newPage();

      // Interceptar peticiones innecesarias (imágenes, fuentes, rastreadores) para reducir consumo de RAM en más del 70%
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        const url = req.url().toLowerCase();
        if (
          resourceType === 'image' ||
          (resourceType === 'media' && !url.includes('silence.wav')) ||
          resourceType === 'font' ||
          url.includes('google-analytics') ||
          url.includes('googletagmanager') ||
          url.includes('facebook') ||
          url.includes('hotjar') ||
          url.includes('clarity.ms')
        ) {
          req.abort().catch(() => {});
        } else {
          req.continue().catch(() => {});
        }
      });

      page.on('error', (err) => {
        console.error(`[Bot ${botId}] Page runtime error:`, err.message);
      });
      page.on('close', () => {
        console.log(`[Bot ${botId}] Page closed.`);
      });

      // Select random realistic User-Agent for this bot
      const selectedUserAgent = USER_AGENTS_POOL[Math.floor(Math.random() * USER_AGENTS_POOL.length)];

      // Set optimized browser viewport & unique user agent
      await page.setViewport({ width: 800, height: 600 });
      await page.setUserAgent(selectedUserAgent);

      // Guarantee 100% silent audio & blank video at Browser API level
      await page.evaluateOnNewDocument(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
          navigator.mediaDevices.getUserMedia = async function(constraints) {
            const stream = await origGetUserMedia(constraints);
            try {
              stream.getAudioTracks().forEach(track => {
                track.enabled = false;
                track.stop();
              });
              stream.getVideoTracks().forEach(track => {
                track.enabled = false;
                track.stop();
              });
            } catch (e) {}
            return stream;
          };
        }
      });

      const isWordPressAulaVirtual = baseUrl.includes('aula-virtual') || baseUrl.includes('creamosia.com');
      let joinedSuccess = false;

      if (isWordPressAulaVirtual) {
        const employee = dataStore.getEmployees().find(e => e.id === employeeId);
        const login = employee ? (employee.login || botRecord.login) : botRecord.login;
        const pass = employee ? (employee.pass || botRecord.pass) : botRecord.pass;
        const dni = employee ? (employee.dni || botRecord.dni) : botRecord.dni;

        if (login && pass) {
          console.log(`[Bot ${botId}] Step 1: Logging in as ${login}...`);
          dataStore.addBotLog(botId, `Iniciando sesión en WordPress (${login})...`, 'info');
          try {
            await safeGoto(page, 'https://creamosia.com/wp-login.php', { waitUntil: 'domcontentloaded', timeout: 35000 });
            
            const userInput = await page.waitForSelector('#user_login', { timeout: 15000 }).catch(() => null);
            if (userInput) {
              await page.type('#user_login', login, { delay: 20 });
              await page.type('#user_pass', pass, { delay: 20 });
              
              const rememberCheck = await page.$('#rememberme');
              if (rememberCheck) await rememberCheck.click().catch(() => {});

              await new Promise(r => setTimeout(r, 500));

              await Promise.all([
                page.click('#wp-submit'),
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
              ]);
            }

            await new Promise(r => setTimeout(r, 2000));

            // Verify cookies to confirm valid WordPress session
            const cookies = await page.cookies();
            const isAuth = cookies.some(c => c.name.startsWith('wordpress_logged_in_'));
            if (isAuth) {
              console.log(`[Bot ${botId}] ✅ Sesión confirmada en WordPress como ${login}`);
              dataStore.addBotLog(botId, `Sesión iniciada y confirmada como ${login}`, 'success');
            } else {
              console.warn(`[Bot ${botId}] ⚠️ Cookie wordpress_logged_in no detectada para ${login}`);
            }
          } catch (wpLoginErr) {
            console.warn(`[Bot ${botId}] Advertencia al iniciar sesión WP:`, wpLoginErr.message);
          }
        }

        console.log(`[Bot ${botId}] Step 2: Navigating to Aula Virtual: ${baseUrl}`);
        dataStore.addBotLog(botId, `Conectando al Aula Virtual...`, 'info');
        await safeGoto(page, baseUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
        // Inyectar CSS global para suprimir permanentemente popups de Elementor
        await page.addStyleTag({
          content: '.elementor-popup-modal, .dialog-widget, .dialog-lightbox-widget, .dialog-message { display: none !important; visibility: hidden !important; pointer-events: none !important; }'
        }).catch(() => {});

        // Cerrar cualquier popup modal de Elementor que ya exista
        await page.evaluate(() => {
          document.querySelectorAll('.elementor-popup-modal, .dialog-widget, .dialog-lightbox-widget').forEach(el => el.remove());
        }).catch(() => {});

        // Comprobar si pide DNI por si no estaba logueado
        const dniInput = await page.$('input[name="gc_dni"], input[name="dni"], #gc_dni, #dni');
        if (dniInput && dni) {
          console.log(`[Bot ${botId}] Ingresando DNI ${dni}...`);
          dataStore.addBotLog(botId, `Identificándose con DNI ${dni}...`, 'info');
          await dniInput.type(dni, { delay: 15 });
          const submitDni = await page.$('button[type="submit"], input[type="submit"], #gc-verificar-dni');
          if (submitDni) {
            await Promise.all([
              submitDni.click(),
              page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
            ]);
            await new Promise(r => setTimeout(r, 2000));
            await page.evaluate(() => {
              document.querySelectorAll('.elementor-popup-modal, .dialog-widget, .dialog-lightbox-widget').forEach(el => el.remove());
            }).catch(() => {});
          }
        }

        // Buscar botón entrar a la sala
        const btnEntrar = await page.$('#gc-entrar-sala');
        if (btnEntrar) {
          console.log(`[Bot ${botId}] Step 3: Clicked #gc-entrar-sala`);
          await btnEntrar.click();
          dataStore.addBotLog(botId, 'Bot hizo clic en "Entrar a la sala" en el Aula Virtual', 'info');
          await new Promise(r => setTimeout(r, 2500));
        } else {
          const btnEntrarWait = await page.waitForSelector('#gc-entrar-sala', { timeout: 12000 }).catch(() => null);
          if (btnEntrarWait) {
            console.log(`[Bot ${botId}] Step 3: Clicked #gc-entrar-sala`);
            await btnEntrarWait.click();
            dataStore.addBotLog(botId, 'Bot hizo clic en "Entrar a la sala" en el Aula Virtual', 'info');
            await new Promise(r => setTimeout(r, 2500));
          } else {
            console.log(`[Bot ${botId}] Step 3: #gc-entrar-sala not found, checking for direct iframe...`);
            dataStore.addBotLog(botId, 'Buscando contenedor de sala en Aula Virtual...', 'info');
          }
        }

        // Poll for Jitsi iframe and click Join meeting button reliably (up to 180 seconds to withstand concurrent load)
        const maxWaitMs = 180000;
        const startTime = Date.now();
        let loopCount = 0;
        let joinButtonClicked = false;

        while (Date.now() - startTime < maxWaitMs && !joinedSuccess) {
          loopCount++;

          // If after several loops no iframe, try re-clicking #gc-entrar-sala if present
          if (loopCount % 6 === 0 && !joinButtonClicked) {
            const retryBtn = await page.$('#gc-entrar-sala').catch(() => null);
            if (retryBtn) {
              await retryBtn.click().catch(() => {});
            }
          }

          const frames = page.frames();
          const jitsiFrame = frames.find(f => f.url().includes('aula.creamosia.com') || f.url().includes('jitsi'));

          if (jitsiFrame) {
            try {
              // 1. Check if already inside conference room strictly via Jitsi APP API
              const isAlreadyJoined = await jitsiFrame.evaluate(() => {
                if (window.APP && window.APP.conference && typeof window.APP.conference.isJoined === 'function') {
                  return window.APP.conference.isJoined() === true;
                }
                return false;
              }).catch(() => false);

              if (isAlreadyJoined) {
                console.log(`[Bot ${botId}] ✅ Confirmado: ¡Dentro de la reunión Jitsi!`);
                dataStore.addBotLog(botId, 'Bot confirmado dentro de la conferencia Jitsi', 'success');
                joinedSuccess = true;
                break;
              }

              // 2. Click prejoin button and let Jitsi enter the conference room
              if (!joinButtonClicked) {
                const clickResult = await jitsiFrame.evaluate(() => {
                  const input = document.querySelector('input[type="text"]');
                  if (input) {
                    input.focus();
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                  }

                  const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
                  for (const b of buttons) {
                    const aria = (b.getAttribute('aria-label') || '').toLowerCase();
                    const title = (b.getAttribute('title') || '').toLowerCase();
                    // Solo silenciar si dice "silenciar" o "mute" (es decir, si estaba encendido)
                    if ((aria.includes('silenciar') || aria.includes('mute microphone') || title.includes('silenciar')) && !aria.includes('reactivar')) {
                      b.click();
                    }
                    // Solo apagar cámara si dice "detener" o "stop" (es decir, si estaba encendida)
                    if ((aria.includes('detener') || aria.includes('stop camera') || title.includes('detener')) && !aria.includes('iniciar') && !aria.includes('activar')) {
                      b.click();
                    }
                  }

                  // Find Join button
                  const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
                  const target = btns.find(b => {
                    const txt = (b.innerText || b.textContent || '').toLowerCase();
                    const aria = (b.getAttribute('aria-label') || '').toLowerCase();
                    return txt.includes('entrar a la reunión') || txt.includes('unirse') || txt.includes('join') || txt.includes('entrar') || aria.includes('entrar a la reunión') || aria.includes('unirse') || aria.includes('join');
                  });

                  if (target) {
                    target.removeAttribute('disabled');
                    target.disabled = false;
                    target.click();
                    return target.innerText || target.textContent || 'Join Clicked';
                  }
                  return null;
                }).catch(() => null);

                if (clickResult) {
                  joinButtonClicked = true;
                  console.log(`[Bot ${botId}] Clic en botón de entrada: "${clickResult}"`);
                  await page.keyboard.press('Enter').catch(() => {});
                  dataStore.addBotLog(botId, `Bot hizo clic en botón prejoin "${clickResult}". Entrando a la sala...`, 'info');
                }
              }
            } catch (err) {
              // Frame still loading
            }
          }
          await new Promise(r => setTimeout(r, 1500));
        }

        // Post-join mute & low-bandwidth enforcement purely via Jitsi API
        const endFrames = page.frames();
        const finalJitsiFrame = endFrames.find(f => f.url().includes('aula.creamosia.com') || f.url().includes('jitsi'));
        if (finalJitsiFrame) {
          await finalJitsiFrame.evaluate(async () => {
            if (window.APP && window.APP.conference) {
              try {
                if (!window.APP.conference.isLocalAudioMuted()) {
                  window.APP.conference.muteAudio(true);
                }
                if (!window.APP.conference.isLocalVideoMuted()) {
                  window.APP.conference.muteVideo(true);
                }
                if (typeof window.APP.conference.setReceiverVideoConstraint === 'function') {
                  window.APP.conference.setReceiverVideoConstraint(0);
                }
                if (typeof window.APP.conference.setLastN === 'function') {
                  window.APP.conference.setLastN(0);
                }
              } catch (e) {}
            }
          }).catch(() => {});
          dataStore.addBotLog(botId, 'Micrófono y cámara silenciados correctamente (modo ahorro de ancho de banda LastN=0)', 'info');
        }
      } else {
        // Navigate to direct Jitsi Meet
        console.log(`[Bot ${botId}] Navegando a: ${fullJitsiUrl}`);
        dataStore.addBotLog(botId, `Conectando a la reunión Jitsi: ${baseUrl}`, 'info');
        await page.goto(fullJitsiUrl, { waitUntil: 'networkidle2', timeout: 45000 });

        await new Promise(r => setTimeout(r, 3000));

        try {
          const joinBtnSelector = 'div[role="button"][aria-label*="Join"], button[aria-label*="Unirse"], .action-btn';
          const joinBtn = await page.$(joinBtnSelector);
          if (joinBtn) {
            await joinBtn.click();
            dataStore.addBotLog(botId, 'Bot hizo clic en botón de entrada a la sala', 'info');
          }
        } catch (e) {
          // Hash parameters bypassed prejoin
        }
      }

      if (isWordPressAulaVirtual && !joinedSuccess) {
        throw new Error('No se pudo detectar o acceder a la sala Jitsi (el marco o el botón de entrada no respondieron a tiempo)');
      }

      // Record successful connection
      const connectedAt = new Date();
      dataStore.updateBotStatus(botId, 'connected', { connectedAt, attempt: attemptCount });
      dataStore.addBotLog(botId, `¡Conexión establecida exitosamente en intento ${attemptCount}/${maxAttempts}! Bot activo en la sala.`, 'success');

      // Synchronize assigned IP & User-Agent in WordPress Database (wp_gc_accesos & wp_gc_asistencia)
      if (recordLogin && ipAddress) {
        this.syncWordPressLogs(recordLogin, ipAddress, selectedUserAgent);
        // Double-sync after 6s to ensure the row in wp_gc_asistencia created by Jitsi/Aula Virtual is populated
        setTimeout(() => {
          this.syncWordPressLogs(recordLogin, ipAddress, selectedUserAgent);
        }, 6000);
      }

      // Schedule auto-disconnect if duration is set
      if (durationMinutes > 0) {
        const timeoutMs = durationMinutes * 60 * 1000;
        timer = setTimeout(() => {
          console.log(`[Bot ${botId}] Duración completada (${durationMinutes} min). Desconectando...`);
          this.stopBot(botId);
        }, timeoutMs);
      }

      // Recurring interval to keep WordPress attendance ping alive and Jitsi strictly muted (every 10 seconds)
      muteCheckInterval = setInterval(async () => {
        try {
          if (page && !page.isClosed()) {
            // Keep WordPress Aula Virtual attendance ping alive
            await page.evaluate(() => {
              if (typeof window.gc_enviar_ping === 'function') {
                window.gc_enviar_ping();
              }
              window.dispatchEvent(new Event('mousemove'));
            }).catch(() => {});

            const frames = page.frames();
            const jitsiFrame = frames.find(f => f.url().includes('aula.creamosia.com') || f.url().includes('jitsi'));
            if (jitsiFrame) {
              await jitsiFrame.evaluate(() => {
                if (window.APP && window.APP.conference) {
                  try {
                    if (!window.APP.conference.isLocalAudioMuted()) {
                      window.APP.conference.muteAudio(true);
                    }
                    if (!window.APP.conference.isLocalVideoMuted()) {
                      window.APP.conference.muteVideo(true);
                    }
                    if (typeof window.APP.conference.setReceiverVideoConstraint === 'function') {
                      window.APP.conference.setReceiverVideoConstraint(0);
                    }
                    if (typeof window.APP.conference.setLastN === 'function') {
                      window.APP.conference.setLastN(0);
                    }
                  } catch (e) {}
                }
              }).catch(() => {});
            }
          }
        } catch (e) {}
      }, 10000);

      // Keep reference to active instance
      this.activeInstances.set(botId, { browser, page, timer, muteCheckInterval, botProfileDir });
      return true;

    } catch (error) {
      console.error(`[Bot ${botId}] Error en intento ${attemptCount}/${maxAttempts}:`, error.message);

      if (muteCheckInterval) clearInterval(muteCheckInterval);
      if (browser) {
        try { await browser.close(); } catch (e) {}
      }

      if (attemptCount < maxAttempts) {
        const nextAttempt = attemptCount + 1;
        dataStore.addBotLog(botId, `⚠️ Fallo en intento ${attemptCount}/${maxAttempts}: ${error.message}. Reintentando automáticamente (${nextAttempt}/${maxAttempts}) en 4 segundos...`, 'warning');
        dataStore.updateBotStatus(botId, 'retrying', { attempt: attemptCount, nextAttempt, batchNumber, totalBatches, errorMsg: error.message });

        await new Promise(r => setTimeout(r, 4000));
        return await this.runPuppeteerBot(botRecord, baseUrl, nextAttempt, batchNumber, totalBatches);
      } else {
        dataStore.addBotLog(botId, `✕ Fallo definitivo tras ${maxAttempts} intentos: ${error.message}`, 'error');
        dataStore.updateBotStatus(botId, 'error', { attempt: maxAttempts, maxAttempts, batchNumber, totalBatches, errorMsg: `Fallo tras ${maxAttempts} intentos: ${error.message}` });
        return false;
      }
    }
  }

  async stopBot(botId) {
    const instance = this.activeInstances.get(botId);
    if (instance) {
      const { browser, timer, muteCheckInterval, botProfileDir } = instance;
      if (timer) clearTimeout(timer);
      if (muteCheckInterval) clearInterval(muteCheckInterval);
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.error(`[Bot ${botId}] Error al cerrar navegador:`, e.message);
        }
      }
      if (botProfileDir && fs.existsSync(botProfileDir)) {
        try {
          fs.rmSync(botProfileDir, { recursive: true, force: true });
        } catch (e) {}
      }
      this.activeInstances.delete(botId);
    }
    dataStore.removeBot(botId);
  }

  async stopAllBots() {
    const botIds = Array.from(this.activeInstances.keys());
    for (const botId of botIds) {
      await this.stopBot(botId);
    }
    // Also clear any remaining scheduled bots in dataStore
    const activeBots = dataStore.getActiveBots();
    for (const bot of activeBots) {
      dataStore.removeBot(bot.id);
    }
  }
}

module.exports = new BotManager();
