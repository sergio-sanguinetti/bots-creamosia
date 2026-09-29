const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class DataStore {
  constructor() {
    this.dataPath = path.join(__dirname, '..', 'data', 'db.json');
    this.companies = [];
    this.courses = [];
    this.employees = [];
    this.scheduledMeetings = [];
    this.activeBots = new Map(); // botId -> Bot object
    this.sseClients = new Set();
    
    // Seed expanded dataset for Spain
    this.seedInitialData();
    // Load persisted state from disk
    this.loadFromDisk();
  }

  saveToDisk() {
    try {
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const dataToSave = {
        companies: this.companies,
        courses: this.courses,
        employees: this.employees,
        scheduledMeetings: this.scheduledMeetings
      };
      fs.writeFileSync(this.dataPath, JSON.stringify(dataToSave, null, 2), 'utf8');
    } catch (err) {
      console.error('[DataStore Save Error]:', err.message);
    }
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const raw = fs.readFileSync(this.dataPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.employees) && parsed.employees.length > 0) {
          this.employees = parsed.employees;
        }
        if (Array.isArray(parsed.scheduledMeetings)) {
          this.scheduledMeetings = parsed.scheduledMeetings;
        }
        if (Array.isArray(parsed.companies) && parsed.companies.length > 0) {
          this.companies = parsed.companies;
        }
        if (Array.isArray(parsed.courses) && parsed.courses.length > 0) {
          this.courses = parsed.courses;
        }
        console.log(`[DataStore] Loaded ${this.employees.length} employees & ${this.scheduledMeetings.length} meetings from disk (${this.dataPath})`);
      }
    } catch (err) {
      console.error('[DataStore Load Error]:', err.message);
    }
  }

  seedInitialData() {
    this.spainCities = [
      { city: 'Madrid', region: 'Comunidad de Madrid', flag: '🇪🇸' },
      { city: 'Barcelona', region: 'Cataluña', flag: '🇪🇸' },
      { city: 'Valencia', region: 'Comunitat Valenciana', flag: '🇪🇸' },
      { city: 'Sevilla', region: 'Andalucía', flag: '🇪🇸' },
      { city: 'Zaragoza', region: 'Aragón', flag: '🇪🇸' },
      { city: 'Málaga', region: 'Andalucía', flag: '🇪🇸' },
      { city: 'Murcia', region: 'Región de Murcia', flag: '🇪🇸' },
      { city: 'Palma de Mallorca', region: 'Islas Baleares', flag: '🇪🇸' },
      { city: 'Las Palmas de Gran Canaria', region: 'Canarias', flag: '🇪🇸' },
      { city: 'Bilbao', region: 'País Vasco', flag: '🇪🇸' },
      { city: 'Alicante', region: 'Comunitat Valenciana', flag: '🇪🇸' },
      { city: 'Córdoba', region: 'Andalucía', flag: '🇪🇸' },
      { city: 'Valladolid', region: 'Castilla y León', flag: '🇪🇸' },
      { city: 'Vigo', region: 'Galicia', flag: '🇪🇸' },
      { city: 'Gijón', region: 'Principado de Asturias', flag: '🇪🇸' },
      { city: 'Vitoria-Gasteiz', region: 'País Vasco', flag: '🇪🇸' },
      { city: 'A Coruña', region: 'Galicia', flag: '🇪🇸' },
      { city: 'Elche', region: 'Comunitat Valenciana', flag: '🇪🇸' },
      { city: 'Granada', region: 'Andalucía', flag: '🇪🇸' },
      { city: 'Tarragona', region: 'Cataluña', flag: '🇪🇸' },
      { city: 'Badalona', region: 'Cataluña', flag: '🇪🇸' },
      { city: 'Oviedo', region: 'Principado de Asturias', flag: '🇪🇸' },
      { city: 'Cartagena', region: 'Región de Murcia', flag: '🇪🇸' },
      { city: 'Terrassa', region: 'Cataluña', flag: '🇪🇸' },
      { city: 'Jerez de la Frontera', region: 'Andalucía', flag: '🇪🇸' },
      { city: 'Sabadell', region: 'Cataluña', flag: '🇪🇸' },
      { city: 'Santa Cruz de Tenerife', region: 'Canarias', flag: '🇪🇸' },
      { city: 'Pamplona', region: 'Comunidad Foral de Navarra', flag: '🇪🇸' },
      { city: 'Almería', region: 'Andalucía', flag: '🇪🇸' },
      { city: 'San Sebastián', region: 'País Vasco', flag: '🇪🇸' },
      { city: 'Burgos', region: 'Castilla y León', flag: '🇪🇸' },
      { city: 'Santander', region: 'Cantabria', flag: '🇪🇸' },
      { city: 'Castellón de la Plana', region: 'Comunitat Valenciana', flag: '🇪🇸' },
      { city: 'Albacete', region: 'Castilla-La Mancha', flag: '🇪🇸' },
      { city: 'Logroño', region: 'La Rioja', flag: '🇪🇸' },
      { city: 'Badajoz', region: 'Extremadura', flag: '🇪🇸' },
      { city: 'Salamanca', region: 'Castilla y León', flag: '🇪🇸' },
      { city: 'Huelva', region: 'Andalucía', flag: '🇪🇸' },
      { city: 'Lleida', region: 'Cataluña', flag: '🇪🇸' },
      { city: 'Marbella', region: 'Andalucía', flag: '🇪🇸' },
      { city: 'León', region: 'Castilla y León', flag: '🇪🇸' },
      { city: 'Cádiz', region: 'Andalucía', flag: '🇪🇸' },
      { city: 'Girona', region: 'Cataluña', flag: '🇪🇸' },
      { city: 'Cáceres', region: 'Extremadura', flag: '🇪🇸' },
      { city: 'Santiago de Compostela', region: 'Galicia', flag: '🇪🇸' },
      { city: 'Orense', region: 'Galicia', flag: '🇪🇸' },
      { city: 'Lugo', region: 'Galicia', flag: '🇪🇸' },
      { city: 'Pontevedra', region: 'Galicia', flag: '🇪🇸' },
      { city: 'Toledo', region: 'Castilla-La Mancha', flag: '🇪🇸' },
      { city: 'Ciudad Real', region: 'Castilla-La Mancha', flag: '🇪🇸' },
      { city: 'Cuenca', region: 'Castilla-La Mancha', flag: '🇪🇸' },
      { city: 'Guadalajara', region: 'Castilla-La Mancha', flag: '🇪🇸' },
      { city: 'Palencia', region: 'Castilla y León', flag: '🇪🇸' },
      { city: 'Zamora', region: 'Castilla y León', flag: '🇪🇸' },
      { city: 'Ávila', region: 'Castilla y León', flag: '🇪🇸' },
      { city: 'Segovia', region: 'Castilla y León', flag: '🇪🇸' },
      { city: 'Teruel', region: 'Aragón', flag: '🇪🇸' },
      { city: 'Huesca', region: 'Aragón', flag: '🇪🇸' },
      { city: 'Soria', region: 'Castilla y León', flag: '🇪🇸' },
      { city: 'Ceuta', region: 'Ciudad Autónoma de Ceuta', flag: '🇪🇸' },
      { city: 'Melilla', region: 'Ciudad Autónoma de Melilla', flag: '🇪🇸' }
    ];

    this.ipPool = [
      // Madrid
      { id: 'ip_mad_1', ip: '138.100.1.1', city: 'Madrid', region: 'Comunidad de Madrid' },
      { id: 'ip_mad_2', ip: '150.244.1.1', city: 'Madrid', region: 'Comunidad de Madrid' },
      { id: 'ip_mad_3', ip: '163.117.1.1', city: 'Madrid', region: 'Comunidad de Madrid' },
      { id: 'ip_mad_4', ip: '147.96.1.1', city: 'Madrid', region: 'Comunidad de Madrid' },

      // Barcelona
      { id: 'ip_bcn_1', ip: '161.116.1.1', city: 'Barcelona', region: 'Cataluña' },
      { id: 'ip_bcn_2', ip: '147.83.1.1', city: 'Barcelona', region: 'Cataluña' },
      { id: 'ip_bcn_3', ip: '158.109.1.1', city: 'Barcelona', region: 'Cataluña' },
      { id: 'ip_bcn_4', ip: '193.145.50.1', city: 'Barcelona', region: 'Cataluña' },

      // Valencia
      { id: 'ip_vlc_1', ip: '147.156.1.1', city: 'Valencia', region: 'Comunitat Valenciana' },
      { id: 'ip_vlc_2', ip: '158.42.1.1', city: 'Valencia', region: 'Comunitat Valenciana' },
      { id: 'ip_vlc_3', ip: '147.156.100.1', city: 'Valencia', region: 'Comunitat Valenciana' },

      // Sevilla
      { id: 'ip_sev_1', ip: '150.214.1.1', city: 'Sevilla', region: 'Andalucía' },
      { id: 'ip_sev_2', ip: '150.214.12.1', city: 'Sevilla', region: 'Andalucía' },
      { id: 'ip_sev_3', ip: '193.147.128.1', city: 'Sevilla', region: 'Andalucía' },

      // Bilbao
      { id: 'ip_bio_1', ip: '158.227.1.1', city: 'Bilbao', region: 'País Vasco' },
      { id: 'ip_bio_2', ip: '158.227.50.1', city: 'Bilbao', region: 'País Vasco' },
      { id: 'ip_bio_3', ip: '158.227.100.1', city: 'Bilbao', region: 'País Vasco' },

      // Málaga
      { id: 'ip_agp_1', ip: '150.214.40.97', city: 'Málaga', region: 'Andalucía' },
      { id: 'ip_agp_2', ip: '150.214.45.1', city: 'Málaga', region: 'Andalucía' },

      // Zaragoza
      { id: 'ip_zaz_1', ip: '155.210.1.1', city: 'Zaragoza', region: 'Aragón' },
      { id: 'ip_zaz_2', ip: '155.210.10.1', city: 'Zaragoza', region: 'Aragón' },

      // Alicante
      { id: 'ip_alc_1', ip: '193.145.204.1', city: 'Alicante', region: 'Comunitat Valenciana' },
      { id: 'ip_alc_2', ip: '193.145.200.1', city: 'Alicante', region: 'Comunitat Valenciana' }
    ];

    this.companies = [
      { id: 'comp_spain_1', name: 'Telefónica Soluciones España' },
      { id: 'comp_spain_2', name: 'Iberdrola Innovación & Energía' },
      { id: 'comp_spain_3', name: 'Mercadona Logística y Distribución' },
      { id: 'comp_spain_4', name: 'Banco Santander Digital' },
      { id: 'comp_orquestacion', name: 'ORQUESTACION BOTS' }
    ];

    this.courses = [
      { id: 'course_1', title: 'Prevención de Riesgos Laborales (PRL)', city: 'Madrid', region: 'Comunidad de Madrid' },
      { id: 'course_2', title: 'Protección de Datos (RGPD) y Ciberseguridad', city: 'Barcelona', region: 'Cataluña' },
      { id: 'course_3', title: 'Igualdad y Protocolo de Acoso Laboral', city: 'Valencia', region: 'Comunitat Valenciana' },
      { id: 'course_4', title: 'Primeros Auxilios y Plan de Emergencia', city: 'Sevilla', region: 'Andalucía' },
      { id: 'course_5', title: 'Transformación Digital y Herramientas Cloud', city: 'Bilbao', region: 'País Vasco' },
      { id: 'course_17066', title: 'prueba orquetacion', city: 'Madrid', region: 'Comunidad de Madrid' }
    ];

    // Spanish First Names and Surnames generator lists for authentic generation
    const firstNames = [
      'Alejandro', 'Lucía', 'Hugo', 'Sofía', 'Mateo', 'Valeria', 'Daniel', 'Paula',
      'Pablo', 'Alba', 'Álvaro', 'Emma', 'Adrián', 'Julia', 'David', 'Carla',
      'Diego', 'Sara', 'Javier', 'Noa', 'Mario', 'Carmen', 'Manuel', 'Claudia',
      'Marcos', 'Elena', 'Gonzalo', 'Martina', 'Nicolás', 'Laura', 'Iker', 'Ana',
      'Carlos', 'Irene', 'Sergio', 'María', 'Jorge', 'Marta', 'Fernando', 'Alicia',
      'Rubén', 'Rocío', 'Iván', 'Beatriz', 'Oscar', 'Natalia', 'Raúl', 'Silvia'
    ];

    const surnames = [
      'García', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez',
      'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno',
      'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres',
      'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Molina',
      'Morales', 'Suárez', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín'
    ];

    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';

    const generateDNI = (index) => {
      const num = 45000000 + index * 1237;
      const letter = letters[num % 23];
      return `${num}${letter}`;
    };

    const generateEmail = (firstName, surname, domain) => {
      const cleanName = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cleanSurname = surname.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return `${cleanName}.${cleanSurname}@${domain}`;
    };

    this.employees = [];

    // Helper to get matching IP by course city
    const getInitialIp = (courseId, idx) => {
      // Seed some employees with IPs and leave others unassigned for demonstration
      if (idx % 3 === 0) return null;
      const course = this.courses.find(c => c.id === courseId);
      const city = course ? course.city : 'Madrid';
      const matchingIps = this.ipPool.filter(i => i.city === city);
      const chosenIp = matchingIps[idx % matchingIps.length] || this.ipPool[0];
      return {
        ipAddress: chosenIp.ip,
        ipCity: chosenIp.city,
        ipRegion: chosenIp.region,
        ipIsp: chosenIp.isp
      };
    };

    // Company 1: Telefónica Soluciones España (22 employees)
    const domain1 = 'telefonica.es';
    for (let i = 0; i < 22; i++) {
      const fn = firstNames[i % firstNames.length];
      const sn1 = surnames[(i * 2) % surnames.length];
      const sn2 = surnames[(i * 3 + 1) % surnames.length];
      const fullName = `${fn} ${sn1} ${sn2}`;
      const courseIds = i % 2 === 0 ? ['course_1', 'course_2'] : ['course_2', 'course_5'];
      const ipData = getInitialIp(courseIds[0], i);
      
      this.employees.push({
        id: `emp_es_1${(i + 1).toString().padStart(2, '0')}`,
        name: fullName,
        companyId: 'comp_spain_1',
        companyName: 'Telefónica Soluciones España',
        dni: generateDNI(100 + i),
        email: generateEmail(fn, sn1, domain1),
        courses: courseIds,
        ipAddress: ipData ? ipData.ipAddress : null,
        ipCity: ipData ? ipData.ipCity : null,
        ipRegion: ipData ? ipData.ipRegion : null,
        ipIsp: ipData ? ipData.ipIsp : null
      });
    }

    // Company 2: Iberdrola Innovación & Energía (22 employees)
    const domain2 = 'iberdrola.es';
    for (let i = 0; i < 22; i++) {
      const fn = firstNames[(i + 5) % firstNames.length];
      const sn1 = surnames[(i * 2 + 3) % surnames.length];
      const sn2 = surnames[(i * 3 + 4) % surnames.length];
      const fullName = `${fn} ${sn1} ${sn2}`;
      const courseIds = i % 3 === 0 ? ['course_1', 'course_4'] : ['course_1', 'course_3'];
      const ipData = getInitialIp(courseIds[0], i);

      this.employees.push({
        id: `emp_es_2${(i + 1).toString().padStart(2, '0')}`,
        name: fullName,
        companyId: 'comp_spain_2',
        companyName: 'Iberdrola Innovación & Energía',
        dni: generateDNI(200 + i),
        email: generateEmail(fn, sn1, domain2),
        courses: courseIds,
        ipAddress: ipData ? ipData.ipAddress : null,
        ipCity: ipData ? ipData.ipCity : null,
        ipRegion: ipData ? ipData.ipRegion : null,
        ipIsp: ipData ? ipData.ipIsp : null
      });
    }

    // Company 3: Mercadona Logística y Distribución (23 employees)
    const domain3 = 'mercadona.es';
    for (let i = 0; i < 23; i++) {
      const fn = firstNames[(i + 12) % firstNames.length];
      const sn1 = surnames[(i * 2 + 7) % surnames.length];
      const sn2 = surnames[(i * 3 + 2) % surnames.length];
      const fullName = `${fn} ${sn1} ${sn2}`;
      const courseIds = i % 2 === 0 ? ['course_1', 'course_4'] : ['course_3', 'course_4'];
      const ipData = getInitialIp(courseIds[0], i);

      this.employees.push({
        id: `emp_es_3${(i + 1).toString().padStart(2, '0')}`,
        name: fullName,
        companyId: 'comp_spain_3',
        companyName: 'Mercadona Logística y Distribución',
        dni: generateDNI(300 + i),
        email: generateEmail(fn, sn1, domain3),
        courses: courseIds,
        ipAddress: ipData ? ipData.ipAddress : null,
        ipCity: ipData ? ipData.ipCity : null,
        ipRegion: ipData ? ipData.ipRegion : null,
        ipIsp: ipData ? ipData.ipIsp : null
      });
    }

    // Company 4: Banco Santander Digital (23 employees)
    const domain4 = 'santander.es';
    for (let i = 0; i < 23; i++) {
      const fn = firstNames[(i + 18) % firstNames.length];
      const sn1 = surnames[(i * 2 + 9) % surnames.length];
      const sn2 = surnames[(i * 3 + 5) % surnames.length];
      const fullName = `${fn} ${sn1} ${sn2}`;
      const courseIds = i % 2 === 0 ? ['course_2', 'course_5'] : ['course_3', 'course_5'];
      const ipData = getInitialIp(courseIds[0], i);

      this.employees.push({
        id: `emp_es_4${(i + 1).toString().padStart(2, '0')}`,
        name: fullName,
        companyId: 'comp_spain_4',
        companyName: 'Banco Santander Digital',
        dni: generateDNI(400 + i),
        email: generateEmail(fn, sn1, domain4),
        courses: courseIds,
        ipAddress: ipData ? ipData.ipAddress : null,
        ipCity: ipData ? ipData.ipCity : null,
        ipRegion: ipData ? ipData.ipRegion : null,
        ipIsp: ipData ? ipData.ipIsp : null
      });
    }

    // Company 5: ORQUESTACION BOTS (15 alumnos)
    for (let i = 1; i <= 15; i++) {
      const num = String(i).padStart(2, '0');
      const ipData = getInitialIp('course_17066', i);
      this.employees.push({
        id: `emp_orq_${num}`,
        name: `Alumno Orquestacion ${num}`,
        companyId: 'comp_orquestacion',
        companyName: 'ORQUESTACION BOTS',
        dni: `123456${num}A`,
        email: `alumno${num}.orquestacion@creamosia.com`,
        login: `alumno_orq_${num}`,
        pass: `AlumnoOrq2026!${num}`,
        courses: ['course_17066'],
        ipAddress: ipData ? ipData.ipAddress : '138.100.1.' + i,
        ipCity: 'Madrid',
        ipRegion: 'Comunidad de Madrid',
        ipIsp: 'Telefónica de España'
      });
    }
  }

  async syncWithWordPress() {
    try {
      const response = await fetch('https://creamosia.com/wp-json/orquestador/v1/sync-data?token=OrqBotSecret2026!', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
      });
      const data = await response.json();
      if (!data || !data.success || !Array.isArray(data.employees)) {
        throw new Error('Respuesta inválida de la API REST de WordPress');
      }

      // Preserve previously assigned IPs if student was already present
      const existingMap = new Map();
      for (const e of this.employees) {
        const key = e.login || e.dni || e.id;
        if (key) existingMap.set(key, e);
      }

      const newEmployees = [];
      const companiesSet = new Set();

      for (let i = 0; i < data.employees.length; i++) {
        const wpEmp = data.employees[i];
        const existing = existingMap.get(wpEmp.login) || existingMap.get(wpEmp.dni) || existingMap.get(wpEmp.id);
        
        const compName = wpEmp.companyName || 'ORQUESTACION BOTS';
        companiesSet.add(compName);

        const empObj = {
          id: wpEmp.id || `emp_wp_${wpEmp.wp_user_id || i + 1}`,
          name: wpEmp.name || wpEmp.login,
          login: wpEmp.login,
          pass: existing && existing.pass ? existing.pass : (wpEmp.login && wpEmp.login.includes('alumno_orq') ? `AlumnoOrq2026!${wpEmp.login.replace('alumno_orq_', '')}` : '123456'),
          dni: wpEmp.dni || '',
          email: wpEmp.email || '',
          companyId: `comp_${compName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          companyName: compName,
          courses: existing && existing.courses && existing.courses.length > 0 ? existing.courses : ['course_17066'],
          ipAddress: existing ? existing.ipAddress : null,
          ipCity: existing ? existing.ipCity : null,
          ipRegion: existing ? existing.ipRegion : null,
          ipIsp: existing ? existing.ipIsp : null
        };

        // If employee has no IP assigned yet, auto-assign from Spain pool
        if (!empObj.ipAddress) {
          const autoIp = this.ipPool[i % this.ipPool.length];
          if (autoIp) {
            empObj.ipAddress = autoIp.ip;
            empObj.ipCity = autoIp.city;
            empObj.ipRegion = autoIp.region;
            empObj.ipIsp = autoIp.isp;
          }
        }

        newEmployees.push(empObj);
      }

      // Rebuild companies based on synced dataset
      this.companies = Array.from(companiesSet).map(cName => ({
        id: `comp_${cName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: cName
      }));

      // Reemplazo total de la lista de empleados
      this.employees = newEmployees;

      this.broadcastUpdate('DATA_IMPORTED', {
        companyCount: this.companies.length,
        employeeCount: this.employees.length,
        courseCount: this.courses.length
      });
      this.broadcastUpdate('EMPLOYEES_UPDATED', this.employees);
      this.saveToDisk();

      return { success: true, count: this.employees.length, total: data.employees.length };
    } catch (err) {
      console.error('[DataStore WP Sync Error]:', err.message);
      throw err;
    }
  }

  // SSE Client Management
  addSSEClient(res) {
    this.sseClients.add(res);
  }

  removeSSEClient(res) {
    this.sseClients.delete(res);
  }

  broadcastUpdate(type, data) {
    const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date() })}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  // Queries
  getCompanies() {
    return this.companies;
  }

  getCourses() {
    return this.courses;
  }

  getIpPool() {
    return {
      cities: this.spainCities,
      ipPool: this.ipPool
    };
  }

  generateIpForCity(targetCity) {
    const cityMap = {
      'Madrid': { region: 'Comunidad de Madrid', ranges: ['138.100', '150.244', '163.117', '147.96'] },
      'Barcelona': { region: 'Cataluña', ranges: ['161.116', '147.83', '158.109', '193.145'] },
      'Valencia': { region: 'Comunitat Valenciana', ranges: ['147.156', '158.42', '193.145'] },
      'Sevilla': { region: 'Andalucía', ranges: ['150.214', '193.147.128', '150.214.12'] },
      'Bilbao': { region: 'País Vasco', ranges: ['158.227'] },
      'Málaga': { region: 'Andalucía', ranges: ['150.214.40', '150.214.45'] },
      'Zaragoza': { region: 'Aragón', ranges: ['155.210'] },
      'Alicante': { region: 'Comunitat Valenciana', ranges: ['193.145.204', '193.145.200'] },
      'Murcia': { region: 'Región de Murcia', ranges: ['155.54', '193.147'] },
      'Palma de Mallorca': { region: 'Islas Baleares', ranges: ['186.32', '147.83'] },
      'Las Palmas de Gran Canaria': { region: 'Canarias', ranges: ['193.145', '153.109'] },
      'Valladolid': { region: 'Castilla y León', ranges: ['157.88'] },
      'Vigo': { region: 'Galicia', ranges: ['193.146'] },
      'Gijón': { region: 'Principado de Asturias', ranges: ['156.35'] },
      'Vitoria-Gasteiz': { region: 'País Vasco', ranges: ['158.227'] },
      'A Coruña': { region: 'Galicia', ranges: ['193.146'] },
      'Granada': { region: 'Andalucía', ranges: ['150.214'] },
      'San Sebastián': { region: 'País Vasco', ranges: ['158.227'] },
      'Pamplona': { region: 'Comunidad Foral de Navarra', ranges: ['159.237'] },
      'Santander': { region: 'Cantabria', ranges: ['193.144'] },
      'Logroño': { region: 'La Rioja', ranges: ['193.146'] },
      'Badajoz': { region: 'Extremadura', ranges: ['158.49'] },
      'Salamanca': { region: 'Castilla y León', ranges: ['157.88'] }
    };

    const foundCity = this.spainCities.find(c => c.city === targetCity);
    const region = foundCity ? foundCity.region : 'España';

    let info = cityMap[targetCity];
    if (!info) {
      // Deterministic IP subnet generation for any other Spanish city
      const nameHash = targetCity.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const subnets = ['193.144', '147.96', '150.214', '158.227', '161.116', '155.210', '157.88'];
      const chosenSubnet = subnets[nameHash % subnets.length];
      info = { region, ranges: [`${chosenSubnet}.${(nameHash % 180) + 10}`] };
    }

    const chosenRange = info.ranges[Math.floor(Math.random() * info.ranges.length)];

    let generatedIp = '';
    if (chosenRange.split('.').length === 3) {
      const lastOctet = Math.floor(Math.random() * 250) + 2;
      generatedIp = `${chosenRange}.${lastOctet}`;
    } else {
      const thirdOctet = Math.floor(Math.random() * 200) + 1;
      const lastOctet = Math.floor(Math.random() * 250) + 2;
      generatedIp = `${chosenRange}.${thirdOctet}.${lastOctet}`;
    }

    const newIpObj = {
      id: `ip_gen_${uuidv4().substring(0, 8)}`,
      ip: generatedIp,
      city: targetCity,
      region: region
    };

    this.ipPool.push(newIpObj);
    this.broadcastUpdate('IP_POOL_UPDATED', { newIp: newIpObj, count: this.ipPool.length });
    return newIpObj;
  }

  getEmployees(filters = {}) {
    let result = [...this.employees];
    if (filters.companyId) {
      result = result.filter(e => e.companyId === filters.companyId);
    }
    if (filters.courseId) {
      result = result.filter(e => e.courses.includes(filters.courseId));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.dni.toLowerCase().includes(q) || 
        e.companyName.toLowerCase().includes(q) ||
        (e.ipAddress && e.ipAddress.includes(q)) ||
        (e.ipCity && e.ipCity.toLowerCase().includes(q))
      );
    }
    return result;
  }

  // Assign IP to employee
  assignEmployeeIp(employeeId, ipObj) {
    const emp = this.employees.find(e => e.id === employeeId);
    if (!emp) return null;

    if (!ipObj) {
      emp.ipAddress = null;
      emp.ipCity = null;
      emp.ipRegion = null;
      emp.ipIsp = null;
    } else {
      let resolvedIp = ipObj;
      if (typeof ipObj === 'string') {
        const found = this.ipPool.find(i => i.ip === ipObj);
        resolvedIp = found || { ip: ipObj, city: 'Madrid', region: 'Comunidad de Madrid' };
      }
      emp.ipAddress = resolvedIp.ip || resolvedIp.ipAddress;
      emp.ipCity = resolvedIp.city || resolvedIp.ipCity || 'Madrid';
      emp.ipRegion = resolvedIp.region || resolvedIp.ipRegion || 'Comunidad de Madrid';
      emp.ipIsp = resolvedIp.isp || resolvedIp.ipIsp || 'Telefónica España';
    }

    this.broadcastUpdate('EMPLOYEE_IP_UPDATED', {
      employeeId: emp.id,
      ipAddress: emp.ipAddress,
      ipCity: emp.ipCity,
      ipRegion: emp.ipRegion,
      ipIsp: emp.ipIsp
    });

    this.saveToDisk();
    return emp;
  }

  autoAssignEmployeeIp(employeeId) {
    const emp = this.employees.find(e => e.id === employeeId);
    if (!emp) return null;

    let targetCity = 'Madrid';
    if (emp.courses && emp.courses.length > 0) {
      const course = this.courses.find(c => c.id === emp.courses[0]);
      if (course && course.city) targetCity = course.city;
    }

    const matchingIps = this.ipPool.filter(i => i.city === targetCity);
    const chosenIp = matchingIps[Math.floor(Math.random() * matchingIps.length)] || this.ipPool[0];

    return this.assignEmployeeIp(employeeId, chosenIp);
  }

  autoAssignAllEmployeesIp(employeeIds = null) {
    const targetEmployees = employeeIds && employeeIds.length > 0
      ? this.employees.filter(e => employeeIds.includes(e.id))
      : this.employees;

    const updated = [];
    targetEmployees.forEach(emp => {
      const res = this.autoAssignEmployeeIp(emp.id);
      if (res) updated.push(res);
    });

    this.broadcastUpdate('ALL_IPS_UPDATED', { count: updated.length });
    return updated;
  }

  // Employee CRUD Operations
  addEmployee(data) {
    const id = data.id || `emp_custom_${uuidv4().substring(0, 8)}`;
    const company = this.companies.find(c => c.id === data.companyId);
    const companyName = company ? company.name : (data.companyName || 'Sin Empresa');

    const newEmp = {
      id,
      name: data.name || 'Nuevo Empleado',
      companyId: data.companyId || '',
      companyName,
      dni: data.dni || '',
      email: data.email || '',
      login: data.login || '',
      pass: data.pass || '',
      courses: data.courses || [],
      ipAddress: data.ipAddress || null,
      ipCity: data.ipCity || null,
      ipRegion: data.ipRegion || null,
      ipIsp: data.ipIsp || null
    };

    this.employees.push(newEmp);
    this.broadcastUpdate('EMPLOYEE_ADDED', newEmp);
    this.saveToDisk();
    return newEmp;
  }

  updateEmployee(id, data) {
    const index = this.employees.findIndex(e => e.id === id);
    if (index === -1) return null;

    const company = this.companies.find(c => c.id === data.companyId);
    if (company) {
      data.companyName = company.name;
    }

    this.employees[index] = { ...this.employees[index], ...data };
    const updated = this.employees[index];
    this.broadcastUpdate('EMPLOYEE_UPDATED', updated);
    this.saveToDisk();
    return updated;
  }

  deleteEmployee(id) {
    const index = this.employees.findIndex(e => e.id === id);
    if (index === -1) return false;
    const removed = this.employees.splice(index, 1)[0];
    this.broadcastUpdate('EMPLOYEE_DELETED', { id: removed.id });
    this.saveToDisk();
    return true;
  }

  // Meeting Scheduling Operations
  getMeetings() {
    return this.scheduledMeetings;
  }

  getMeetingById(id) {
    return this.scheduledMeetings.find(m => m.id === id);
  }

  addMeeting(data) {
    const newMeeting = {
      id: data.id || `meeting_${uuidv4().substring(0, 8)}`,
      title: data.title || 'Reunión sin Título',
      jitsiUrl: data.jitsiUrl || '',
      scheduledTime: data.scheduledTime || new Date().toISOString(),
      durationMinutes: parseInt(data.durationMinutes, 10) || 30,
      assignedEmployeeIds: data.assignedEmployeeIds || [],
      autoMute: data.autoMute !== undefined ? data.autoMute : true,
      staggeredDelay: data.staggeredDelay !== undefined ? data.staggeredDelay : true,
      status: data.status || 'scheduled',
      createdAt: new Date().toISOString()
    };

    this.scheduledMeetings.push(newMeeting);
    this.broadcastUpdate('MEETING_ADDED', newMeeting);
    this.saveToDisk();
    return newMeeting;
  }

  updateMeeting(id, data) {
    const index = this.scheduledMeetings.findIndex(m => m.id === id);
    if (index === -1) return null;

    this.scheduledMeetings[index] = { ...this.scheduledMeetings[index], ...data };
    const updated = this.scheduledMeetings[index];
    this.broadcastUpdate('MEETING_UPDATED', updated);
    this.saveToDisk();
    return updated;
  }

  deleteMeeting(id) {
    const index = this.scheduledMeetings.findIndex(m => m.id === id);
    if (index === -1) return false;
    const removed = this.scheduledMeetings.splice(index, 1)[0];
    this.broadcastUpdate('MEETING_DELETED', { id: removed.id });
    this.saveToDisk();
    return true;
  }

  // Bulk update data from Excel
  importExcelData({ companies, courses, employees }) {
    if (companies && companies.length > 0) {
      this.companies = companies;
    }
    if (courses && courses.length > 0) {
      this.courses = courses;
    }
    if (employees && employees.length > 0) {
      this.employees = employees;
    }
    this.broadcastUpdate('DATA_IMPORTED', {
      companyCount: this.companies.length,
      employeeCount: this.employees.length,
      courseCount: this.courses.length
    });
    this.saveToDisk();
  }

  // Bot State Management
  addBot(botData) {
    botData.networkLogs = botData.networkLogs || [
      { timestamp: new Date().toLocaleTimeString('es-ES'), message: 'Bot programado e inicializado', type: 'info' }
    ];
    this.activeBots.set(botData.id, botData);
    this.broadcastUpdate('BOT_UPDATED', this.getBotPublicState(botData));
  }

  addBotLog(botId, message, type = 'info') {
    const bot = this.activeBots.get(botId);
    if (bot) {
      if (!bot.networkLogs) bot.networkLogs = [];
      const entry = { timestamp: new Date().toLocaleTimeString('es-ES'), message, type };
      bot.networkLogs.unshift(entry);
      if (bot.networkLogs.length > 50) bot.networkLogs.pop();
      this.broadcastUpdate('BOT_UPDATED', this.getBotPublicState(bot));
    }
  }

  updateBotStatus(botId, status, details = {}) {
    const bot = this.activeBots.get(botId);
    if (bot) {
      bot.status = status;
      Object.assign(bot, details);
      this.broadcastUpdate('BOT_UPDATED', this.getBotPublicState(bot));
    }
  }

  removeBot(botId) {
    const bot = this.activeBots.get(botId);
    if (bot) {
      bot.status = 'terminated';
      this.addBotLog(botId, 'Bot finalizado y removido de la sesión', 'warning');
      this.broadcastUpdate('BOT_REMOVED', { id: botId, status: 'terminated' });
      this.activeBots.delete(botId);
    }
  }

  getActiveBots() {
    return Array.from(this.activeBots.values()).map(bot => this.getBotPublicState(bot));
  }

  getBotPublicState(bot) {
    const { browser, page, timer, ...publicData } = bot;
    return publicData;
  }
}

module.exports = new DataStore();
