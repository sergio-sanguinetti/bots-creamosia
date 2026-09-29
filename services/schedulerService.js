const dataStore = require('./dataStore');
const botManager = require('./botManager');

class SchedulerService {
  constructor() {
    this.interval = null;
    this.checkFrequencyMs = 10000; // Check every 10 seconds
  }

  start() {
    if (this.interval) return;
    console.log('[SchedulerService] 🕒 Background CronJob Scheduler iniciado. Verificando reuniones cada 10s...');
    
    // Limpiar reuniones que quedaron en 'in_progress' si el servidor se reinició
    const meetings = dataStore.getMeetings();
    for (const m of meetings) {
      if (m.status === 'in_progress') {
        console.log(`[SchedulerService] Limpiando reunión previa interrumpida: "${m.title}"`);
        dataStore.updateMeeting(m.id, { status: 'completed', endedAt: new Date().toISOString() });
      }
    }

    this.interval = setInterval(() => {
      this.checkScheduledMeetings();
    }, this.checkFrequencyMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async checkScheduledMeetings() {
    const meetings = dataStore.getMeetings();
    const now = Date.now();

    for (const meeting of meetings) {
      if (meeting.status === 'scheduled') {
        const scheduledTimeMs = new Date(meeting.scheduledTime).getTime();

        if (isNaN(scheduledTimeMs)) {
          console.warn(`[SchedulerService] Fecha inválida para reunión "${meeting.title}":`, meeting.scheduledTime);
          continue;
        }

        // Check if scheduled time has arrived or passed
        if (scheduledTimeMs <= now) {
          const diffMinutes = (now - scheduledTimeMs) / (1000 * 60);

          if (diffMinutes > 120) {
            // Meeting was scheduled more than 2 hours ago while server was offline
            console.warn(`[SchedulerService] ⚠️ Reunión "${meeting.title}" expiró (programada hace ${Math.round(diffMinutes)} min). Marcando como finalizada.`);
            dataStore.updateMeeting(meeting.id, { status: 'completed' });
            continue;
          }

          console.log(`====================================================`);
          console.log(`⏰ [SchedulerService] ¡HORA CUMPLIDA! Activando reunión programada en segundo plano:`);
          console.log(`   Título: "${meeting.title}" (ID: ${meeting.id})`);
          console.log(`   Hora Programada: ${meeting.scheduledTime}`);
          console.log(`   Trabajadores asignados: ${meeting.assignedEmployeeIds ? meeting.assignedEmployeeIds.length : 0}`);
          console.log(`   Sala: ${meeting.jitsiUrl}`);
          console.log(`====================================================`);

          // Mark meeting as in_progress immediately so it won't be picked up again
          dataStore.updateMeeting(meeting.id, { 
            status: 'in_progress', 
            startedAt: new Date().toISOString() 
          });

          if (!meeting.assignedEmployeeIds || meeting.assignedEmployeeIds.length === 0) {
            console.warn(`[SchedulerService] La reunión "${meeting.title}" no tiene empleados asignados.`);
            dataStore.updateMeeting(meeting.id, { status: 'completed' });
            continue;
          }

          try {
            await botManager.launchBots({
              employeeIds: meeting.assignedEmployeeIds,
              jitsiUrl: meeting.jitsiUrl,
              durationMinutes: meeting.durationMinutes || 30,
              staggeredDelay: meeting.staggeredDelay !== undefined ? meeting.staggeredDelay : true,
              autoMute: meeting.autoMute !== undefined ? meeting.autoMute : true
            });

            // Schedule completion timer
            const durationMs = (meeting.durationMinutes || 30) * 60 * 1000;
            setTimeout(() => {
              console.log(`[SchedulerService] 🏁 Reunión "${meeting.title}" ha finalizado su duración programada (${meeting.durationMinutes || 30} min).`);
              dataStore.updateMeeting(meeting.id, { status: 'completed', endedAt: new Date().toISOString() });
            }, durationMs);

          } catch (err) {
            console.error(`[SchedulerService] Error al lanzar bots para la reunión "${meeting.title}":`, err);
            dataStore.updateMeeting(meeting.id, { status: 'error', lastError: err.message });
          }
        }
      }
    }
  }
}

module.exports = new SchedulerService();
