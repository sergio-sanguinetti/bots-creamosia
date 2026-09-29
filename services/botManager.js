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

    const launchedBots = [];

    for (let index = 0; index < employees.length; index++) {
      const employee = employees[index];
      const botId = `bot_${uuidv4().substring(0, 8)}`;
      
      // Staggered delay offset
      const delayMs = staggeredDelay ? index * (Math.floor(Math.random() * 8000) + 5000) : index * 2000;

      // Auto-assign IP if employee has no IP assigned yet
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
        scheduledTime: new Date(Date.now() + delayMs),
        connectedAt: null,
        durationMinutes: parseInt(durationMinutes, 10) || 30,
        autoMute: true
      };

      dataStore.addBot(botRecord);
      launchedBots.push(botRecord);

      // Trigger bot launch in background with delay
      setTimeout(() => {
        this.runPuppeteerBot(botRecord, cleanUrl);
      }, delayMs);
    }

    return launchedBots;
  }

  async runPuppeteerBot(botRecord, baseUrl, attemptCount = 1) {
    const maxAttempts = 3;
    const { id: botId, employeeId, employeeName, companyName, ipAddress, ipCity, durationMinutes, login: recordLogin, pass: recordPass, dni: recordDni } = botRecord;

    dataStore.updateBotStatus(botId, 'connecting', { attempt: attemptCount, maxAttempts });

    if (attemptCount === 1 && ipAddress) {
      dataStore.addBotLog(botId, `Conectando (Intento 1/${maxAttempts}) con IP España asignada: ${ipAddress} (${ipCity})`, 'info');
    } else {
      dataStore.addBotLog(botId, `Iniciando intento ${attemptCount}/${maxAttempts} de conexión a la reunión...`, 'info');
    }

    let browser = null;
    let muteCheckInterval = null;
    let timer = null;

    try {
      // Build display name and URL hash flags for Jitsi Meet auto-join (Always muted audio & video)
      const displayNameParam = encodeURIComponent(`${employeeName} (${companyName})`);
      const fullJitsiUrl = `${baseUrl}#userInfo.displayName="${displayNameParam}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true&config.startSilent=true&config.requireDisplayName=false`;

      const silenceWavPath = path.resolve(__dirname, '..', 'silence.wav');
      const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--no-first-run',
        '--no-zygote',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--mute-audio',
        '--disable-notifications',
        '--disable-permissions-api',
        '--disable-web-security',
        '--autoplay-policy=no-user-gesture-required'
      ];

      // Feed 100% silent WAV audio file into fake microphone instead of default 440Hz test tone / beep
      if (fs.existsSync(silenceWavPath)) {
        launchArgs.push(`--use-file-for-fake-audio-capture=${silenceWavPath}`);
      }

      // Unique isolated browser profile per bot to guarantee 0 session/cookie collisions
      const botProfileDir = path.join(os.tmpdir(), `bot_profile_${botId}`);

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

      page.on('error', (err) => {
        console.error(`[Bot ${botId}] Page runtime error:`, err.message);
      });
      page.on('close', () => {
        console.log(`[Bot ${botId}] Page closed.`);
      });

      // Select random realistic User-Agent for this bot
      const selectedUserAgent = USER_AGENTS_POOL[Math.floor(Math.random() * USER_AGENTS_POOL.length)];

      // Set realistic browser viewport & unique user agent
      await page.setViewport({ width: 1280, height: 720 });
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
            await page.goto('https://creamosia.com/wp-login.php', { waitUntil: 'networkidle2', timeout: 35000 });
            
            const userInput = await page.waitForSelector('#user_login', { timeout: 10000 }).catch(() => null);
            if (userInput) {
              await page.type('#user_login', login, { delay: 20 });
              await page.type('#user_pass', pass, { delay: 20 });
              
              const rememberCheck = await page.$('#rememberme');
              if (rememberCheck) await rememberCheck.click().catch(() => {});

              await Promise.all([
                page.click('#wp-submit'),
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {})
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
        await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 35000 });
        await new Promise(r => setTimeout(r, 2000));

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
              page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 25000 }).catch(() => {})
            ]);
            await new Promise(r => setTimeout(r, 2000));
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
          const btnEntrarWait = await page.waitForSelector('#gc-entrar-sala', { timeout: 8000 }).catch(() => null);
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

        // Poll for Jitsi iframe and click Join meeting button reliably (up to 60 seconds)
        const maxWaitMs = 60000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitMs && !joinedSuccess) {
          const frames = page.frames();
          const jitsiFrame = frames.find(f => f.url().includes('aula.creamosia.com') || f.url().includes('jitsi'));

          if (jitsiFrame) {
            try {
              // Check if already inside conference room strictly via Jitsi API
              const isAlreadyJoined = await jitsiFrame.evaluate(() => {
                return !!(window.APP && window.APP.conference && window.APP.conference.isJoined() === true);
              }).catch(() => false);

              if (isAlreadyJoined) {
                console.log(`[Bot ${botId}] Already joined in conference!`);
                joinedSuccess = true;
                break;
              }

              // Handle prejoin screen: focus input, mute prejoin mic/cam, unlock & click Join button
              const clickResult = await jitsiFrame.evaluate(() => {
                const input = document.querySelector('input[type="text"]');
                if (input) {
                  input.focus();
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                }

                // Click prejoin mute buttons if present (NEVER click if already unmute)
                const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
                for (const b of buttons) {
                  const aria = (b.getAttribute('aria-label') || '').toLowerCase();
                  if (aria.includes('unmute') || aria.includes('activar') || aria.includes('reactivar')) continue;
                  if (aria.includes('mute microphone') || aria.includes('silenciar')) {
                    b.click();
                  }
                  if (aria.includes('stop camera') || aria.includes('detener cámara')) {
                    b.click();
                  }
                }

                // Find Join button
                const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
                const target = btns.find(b => {
                  const txt = (b.innerText || b.textContent || '').toLowerCase();
                  const aria = (b.getAttribute('aria-label') || '').toLowerCase();
                  return txt.includes('unirse') || txt.includes('join') || txt.includes('entrar') || aria.includes('unirse') || aria.includes('join');
                });

                if (target) {
                  target.removeAttribute('disabled');
                  target.disabled = false;
                  target.click();
                  return target.innerText || target.textContent || 'Clicked!';
                }
                return null;
              }).catch(() => null);

              if (clickResult) {
                console.log(`[Bot ${botId}] Clicked prejoin button: ${clickResult}`);
                await page.keyboard.press('Enter').catch(() => {});
                dataStore.addBotLog(botId, `Bot hizo clic en botón prejoin "${clickResult}" dentro del iframe Jitsi`, 'info');
                await new Promise(r => setTimeout(r, 4000));
                joinedSuccess = true;
                break;
              }
            } catch (err) {
              // Frame still loading
            }
          }
          await new Promise(r => setTimeout(r, 1500));
        }

        // Post-join mute enforcement
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
              } catch (e) {}
            }
            const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
            for (const btn of buttons) {
              const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
              if (aria.includes('unmute') || aria.includes('reactivar') || aria.includes('activar')) continue;
              if (aria === 'mute microphone' || aria === 'silenciar micrófono' || aria === 'mute audio') {
                btn.click();
              }
              if (aria === 'stop camera' || aria === 'detener cámara' || aria === 'desactivar cámara') {
                btn.click();
              }
            }
          }).catch(() => {});
          dataStore.addBotLog(botId, 'Micrófono y cámara silenciados correctamente', 'info');
        }
      } else {
        // Navigate to direct Jitsi Meet
        console.log(`[Bot ${botId}] Navegando a: ${fullJitsiUrl}`);
        dataStore.addBotLog(botId, `Conectando a la reunión Jitsi: ${baseUrl}`, 'info');
        await page.goto(fullJitsiUrl, { waitUntil: 'networkidle2', timeout: 35000 });

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
                  } catch (e) {}
                }
              }).catch(() => {});
            }
          }
        } catch (e) {}
      }, 10000);

      // Keep reference to active instance
      this.activeInstances.set(botId, { browser, page, timer, muteCheckInterval, botProfileDir });

    } catch (error) {
      console.error(`[Bot ${botId}] Error en intento ${attemptCount}/${maxAttempts}:`, error.message);

      if (muteCheckInterval) clearInterval(muteCheckInterval);
      if (browser) {
        try { await browser.close(); } catch (e) {}
      }

      if (attemptCount < maxAttempts) {
        const nextAttempt = attemptCount + 1;
        dataStore.addBotLog(botId, `⚠️ Fallo en intento ${attemptCount}/${maxAttempts}: ${error.message}. Reintentando automáticamente (${nextAttempt}/${maxAttempts}) en 4 segundos...`, 'warning');
        dataStore.updateBotStatus(botId, 'retrying', { attempt: attemptCount, nextAttempt, errorMsg: error.message });

        setTimeout(() => {
          this.runPuppeteerBot(botRecord, baseUrl, nextAttempt);
        }, 4000);
      } else {
        dataStore.addBotLog(botId, `✕ Fallo definitivo tras ${maxAttempts} intentos: ${error.message}`, 'error');
        dataStore.updateBotStatus(botId, 'error', { attempt: maxAttempts, maxAttempts, errorMsg: `Fallo tras ${maxAttempts} intentos: ${error.message}` });
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
