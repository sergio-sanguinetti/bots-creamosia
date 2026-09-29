// Sanitize environment variables for Chromium in container environments
if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  const rawPath = process.env.PUPPETEER_EXECUTABLE_PATH.trim();
  if (rawPath && !rawPath.startsWith('/') && !rawPath.includes(':')) {
    process.env.PUPPETEER_EXECUTABLE_PATH = '/' + rawPath;
  }
}

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const dataStore = require('./services/dataStore');
const excelService = require('./services/excelService');
const botManager = require('./services/botManager');
const schedulerService = require('./services/schedulerService');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Multer for Excel file upload in memory
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// REST API Endpoints

// 1. Get Companies
app.get('/api/companies', (req, res) => {
  res.json({ success: true, companies: dataStore.getCompanies() });
});

// 2. Get Courses
app.get('/api/courses', (req, res) => {
  res.json({ success: true, courses: dataStore.getCourses() });
});

// 3. Get Employees with Filters
app.get('/api/employees', (req, res) => {
  const { companyId, courseId, search } = req.query;
  const employees = dataStore.getEmployees({ companyId, courseId, search });
  res.json({ success: true, count: employees.length, employees });
});

// 3.1 Get Spain IP Pool & Cities
app.get('/api/ip-pool', (req, res) => {
  res.json({ success: true, ...dataStore.getIpPool() });
});

// 3.15 Dynamically Generate IP for City
app.post('/api/ip-pool/generate', (req, res) => {
  const { city } = req.body;
  if (!city) {
    return res.status(400).json({ success: false, error: 'Debe especificar una ciudad de España.' });
  }
  const newIpObj = dataStore.generateIpForCity(city);
  res.json({ success: true, message: `Nueva IP generada para ${city}`, ipObj: newIpObj });
});

// 3.2 Assign IP to Employee
app.post('/api/employees/:id/assign-ip', (req, res) => {
  const { id } = req.params;
  const { ip, auto } = req.body;

  let employee = null;
  if (auto) {
    employee = dataStore.autoAssignEmployeeIp(id);
  } else {
    employee = dataStore.assignEmployeeIp(id, ip);
  }

  if (!employee) {
    return res.status(404).json({ success: false, error: 'Empleado no encontrado.' });
  }

  res.json({ success: true, message: 'IP asignada exitosamente.', employee });
});

// 3.3 Auto Assign IPs to Selected or All Employees
app.post('/api/employees/auto-assign-ips', (req, res) => {
  const { employeeIds } = req.body;
  const updated = dataStore.autoAssignAllEmployeesIp(employeeIds);
  res.json({
    success: true,
    message: `Se asignaron IPs automáticamente a ${updated.length} empleado(s) según la ciudad de sus cursos.`,
    count: updated.length
  });
});

// 3.4 Add Employee
app.post('/api/employees', (req, res) => {
  try {
    const newEmp = dataStore.addEmployee(req.body);
    res.json({ success: true, message: 'Empleado creado exitosamente.', employee: newEmp });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3.5 Update Employee
app.put('/api/employees/:id', (req, res) => {
  try {
    const updated = dataStore.updateEmployee(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Empleado no encontrado.' });
    }
    res.json({ success: true, message: 'Empleado actualizado.', employee: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3.6 Delete Employee
app.delete('/api/employees/:id', (req, res) => {
  try {
    const deleted = dataStore.deleteEmployee(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Empleado no encontrado.' });
    }
    res.json({ success: true, message: 'Empleado eliminado.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3.7 Export Employees to Excel
app.get('/api/employees/export-excel', (req, res) => {
  try {
    const employees = dataStore.getEmployees();
    const courses = dataStore.getCourses();
    const buffer = excelService.exportEmployeesBuffer(employees, courses);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Trabajadores_Orquestador_Actualizado.xlsx"');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al exportar a Excel: ' + error.message });
  }
});

// 3.7.1 Sync Employees & Data from WordPress REST API
app.post('/api/sync-wordpress', async (req, res) => {
  try {
    const result = await dataStore.syncWithWordPress();
    res.json({ success: true, message: `Sincronización completada: ${result.total} usuarios procesados desde WordPress`, count: result.count, total: result.total });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al sincronizar con WordPress: ' + error.message });
  }
});

// 3.8 Meeting Endpoints
app.get('/api/meetings', (req, res) => {
  res.json({ success: true, meetings: dataStore.getMeetings() });
});

app.post('/api/meetings', (req, res) => {
  try {
    const meeting = dataStore.addMeeting(req.body);
    res.json({ success: true, message: 'Reunión programada exitosamente.', meeting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/meetings/:id', (req, res) => {
  try {
    const updated = dataStore.updateMeeting(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Reunión no encontrada.' });
    }
    res.json({ success: true, message: 'Reunión actualizada.', meeting: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/meetings/:id', (req, res) => {
  try {
    const deleted = dataStore.deleteMeeting(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Reunión no encontrada.' });
    }
    res.json({ success: true, message: 'Reunión eliminada.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/meetings/:id/launch', async (req, res) => {
  try {
    const meeting = dataStore.getMeetingById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Reunión no encontrada.' });
    }
    if (!meeting.assignedEmployeeIds || meeting.assignedEmployeeIds.length === 0) {
      return res.status(400).json({ success: false, error: 'La reunión no tiene empleados asignados.' });
    }

    const launchedBots = await botManager.launchBots({
      employeeIds: meeting.assignedEmployeeIds,
      jitsiUrl: meeting.jitsiUrl,
      durationMinutes: meeting.durationMinutes,
      staggeredDelay: meeting.staggeredDelay,
      autoMute: meeting.autoMute
    });

    dataStore.updateMeeting(meeting.id, { status: 'in_progress' });

    res.json({
      success: true,
      message: `Se inició la reunión "${meeting.title}" con ${launchedBots.length} bot(s).`,
      bots: launchedBots
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Get Active Bots
app.get('/api/bots/active', (req, res) => {
  res.json({ success: true, bots: dataStore.getActiveBots() });
});

// 5. Upload Excel File
app.post('/api/upload-excel', upload.single('excelFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se envió ningún archivo Excel.' });
    }
    const parsedData = excelService.parseExcelBuffer(req.file.buffer);
    dataStore.importExcelData(parsedData);

    res.json({
      success: true,
      message: 'Archivo Excel procesado exitosamente.',
      stats: {
        companiesCount: parsedData.companies.length,
        coursesCount: parsedData.courses.length,
        employeesCount: parsedData.employees.length
      }
    });
  } catch (error) {
    console.error('Error al procesar Excel:', error);
    res.status(500).json({ success: false, error: 'Error al procesar la hoja de cálculo: ' + error.message });
  }
});

// 6. Download Sample Excel Template
app.get('/api/download-template', (req, res) => {
  try {
    const buffer = excelService.createTemplateBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Plantilla_Bots_Jitsi.xlsx"');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al generar plantilla.' });
  }
});

// 7. Launch Bots for Selected Employees
app.post('/api/bots/launch', async (req, res) => {
  try {
    const { employeeIds, jitsiUrl, durationMinutes, staggeredDelay, autoMute } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Debe seleccionar al menos un empleado.' });
    }
    if (!jitsiUrl || !jitsiUrl.trim()) {
      return res.status(400).json({ success: false, error: 'Debe especificar el enlace de la reunión Jitsi.' });
    }

    const launchedBots = await botManager.launchBots({
      employeeIds,
      jitsiUrl,
      durationMinutes,
      staggeredDelay,
      autoMute: true
    });

    res.json({
      success: true,
      message: `Se programó el inicio de ${launchedBots.length} bot(s) de asistencia.`,
      bots: launchedBots
    });
  } catch (error) {
    console.error('Error al iniciar bots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7.1 Get Bot Logs
app.get('/api/bots/:id/logs', (req, res) => {
  const botId = req.params.id;
  const bot = dataStore.activeBots.get(botId);
  if (!bot) {
    return res.status(404).json({ success: false, error: 'Bot no encontrado o no activo.' });
  }
  res.json({
    success: true,
    botId,
    employeeName: bot.employeeName,
    companyName: bot.companyName,
    status: bot.status,
    logs: bot.networkLogs || []
  });
});

// 8. Stop Single Bot
app.post('/api/bots/stop', async (req, res) => {
  try {
    const { botId } = req.body;
    if (!botId) {
      return res.status(400).json({ success: false, error: 'Se requiere botId.' });
    }
    await botManager.stopBot(botId);
    res.json({ success: true, message: `Bot ${botId} detenido.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Stop All Bots
app.post('/api/bots/stop-all', async (req, res) => {
  try {
    await botManager.stopAllBots();
    res.json({ success: true, message: 'Todos los bots activos han sido detenidos.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Server-Sent Events (SSE) Stream for Live Dashboard Updates
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  dataStore.addSSEClient(res);

  req.on('close', () => {
    dataStore.removeSSEClient(res);
  });
});

// Start Server with Dynamic Port Allocation if EADDRINUSE
function startServer(initialPort) {
  let port = parseInt(initialPort, 10) || 3000;

  const server = app.listen(port, () => {
    console.log(`====================================================`);
    console.log(`🚀 ORQUESTADOR DE BOTS ejecutándose en:`);
    console.log(`   http://localhost:${port}`);
    console.log(`====================================================`);
    schedulerService.start();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  El puerto ${port} está ocupado. Intentando con el puerto ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Error insospechado al iniciar el servidor:', err);
    }
  });
}

const DEFAULT_PORT = process.env.PORT || 3000;
startServer(DEFAULT_PORT);

