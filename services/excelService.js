const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');

class ExcelService {
  parseExcelBuffer(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    const companyMap = new Map();
    const courseMap = new Map();
    const employees = [];

    rawData.forEach((row, index) => {
      const companyName = (row['Empresa'] || row['empresa'] || row['EMPRESA'] || 'Empresa General').toString().trim();
      const employeeName = (row['Empleado'] || row['empleado'] || row['EMPLEADO'] || row['Nombre'] || `Empleado ${index + 1}`).toString().trim();
      const dni = (row['DNI'] || row['dni'] || row['NIF'] || row['nif'] || row['Email'] || `DNI-${45000000 + index}X`).toString().trim();
      const email = (row['Email'] || row['email'] || `${employeeName.toLowerCase().replace(/\s+/g, '.')}@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.es`).toString().trim();
      
      const courseStr = (row['Curso'] || row['curso'] || row['CURSO'] || row['Cursos'] || 'Prevención de Riesgos Laborales (PRL)').toString().trim();
      const courseList = courseStr.split(',').map(c => c.trim()).filter(Boolean);

      // Resolve Company
      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, {
          id: `comp_${uuidv4().substring(0, 8)}`,
          name: companyName
        });
      }
      const companyObj = companyMap.get(companyName);

      // Resolve Courses
      const employeeCourseIds = [];
      courseList.forEach(courseTitle => {
        if (!courseMap.has(courseTitle)) {
          courseMap.set(courseTitle, {
            id: `course_${uuidv4().substring(0, 8)}`,
            title: courseTitle
          });
        }
        employeeCourseIds.push(courseMap.get(courseTitle).id);
      });

      employees.push({
        id: `emp_${uuidv4().substring(0, 8)}`,
        name: employeeName,
        companyId: companyObj.id,
        companyName: companyObj.name,
        dni,
        email,
        courses: employeeCourseIds
      });
    });

    return {
      companies: Array.from(companyMap.values()),
      courses: Array.from(courseMap.values()),
      employees
    };
  }

  createTemplateBuffer() {
    const templateData = [
      { Empresa: 'Telefónica Soluciones España', Empleado: 'Alejandro García López', DNI: '45892011X', Email: 'alejandro.garcia@telefonica.es', Curso: 'Prevención de Riesgos Laborales (PRL), Protección de Datos (RGPD)' },
      { Empresa: 'Telefónica Soluciones España', Empleado: 'Lucía Fernández Martínez', DNI: '72901452Z', Email: 'lucia.fernandez@telefonica.es', Curso: 'Prevención de Riesgos Laborales (PRL)' },
      { Empresa: 'Iberdrola Innovación & Energía', Empleado: 'Hugo Rodríguez Sánchez', DNI: '10482930H', Email: 'hugo.rodriguez@iberdrola.es', Curso: 'Protección de Datos (RGPD) y Ciberseguridad' },
      { Empresa: 'Mercadona Logística y Distribución', Empleado: 'Sofía Pérez Gómez', DNI: '48201948L', Email: 'sofia.perez@mercadona.es', Curso: 'Primeros Auxilios y Plan de Emergencia' },
      { Empresa: 'Banco Santander Digital', Empleado: 'Mateo González Martín', DNI: '46820193K', Email: 'mateo.gonzalez@santander.es', Curso: 'Transformación Digital y Herramientas Cloud' }
    ];

    const worksheet = xlsx.utils.json_to_sheet(templateData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Plantilla_Bots_España');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  exportEmployeesBuffer(employees, courses = []) {
    const courseMap = new Map(courses.map(c => [c.id, c.title]));

    const exportRows = employees.map(emp => {
      const courseTitles = (emp.courses || [])
        .map(cid => courseMap.get(cid) || cid)
        .join(', ');

      return {
        'Empresa': emp.companyName || '',
        'Empleado': emp.name || '',
        'DNI': emp.dni || '',
        'Email': emp.email || '',
        'Usuario Login': emp.login || '',
        'Contraseña': emp.pass || '',
        'Dirección IP': emp.ipAddress || 'Sin IP',
        'Ciudad (España)': emp.ipCity || '',
        'Comunidad Autónoma': emp.ipRegion || '',
        'Cursos': courseTitles
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(exportRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Trabajadores_Actualizados');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

module.exports = new ExcelService();
