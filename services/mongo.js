const dns = require('dns');
// Use reliable public DNS to prevent ECONNREFUSED on SRV lookups across all environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if not supported
}

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://ssanguinetti14_db_user:FtV5P0v8tuPCTeE6@cluster0.4liiwm1.mongodb.net/lodigitalizo_orchestrator?retryWrites=true&w=majority';

// --- Schemas ---

const CompanySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  defaultAulaUrl: { type: String, default: '' },
  slug: { type: String, default: '' }
}, { timestamps: true });

const CourseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  wp_id: { type: Number },
  title: { type: String, required: true },
  companyId: { type: String, default: '' },
  companyName: { type: String, default: '' },
  fixedAulaUrl: { type: String, default: '' },
  city: { type: String, default: 'Madrid' },
  region: { type: String, default: 'Comunidad de Madrid' }
}, { timestamps: true });

const EmployeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  companyId: { type: String, default: '' },
  companyName: { type: String, default: '' },
  dni: { type: String, default: '' },
  email: { type: String, default: '' },
  login: { type: String, default: '' },
  pass: { type: String, default: '' },
  courses: { type: [String], default: [] },
  ipAddress: { type: String, default: null },
  ipCity: { type: String, default: null },
  ipRegion: { type: String, default: null },
  ipIsp: { type: String, default: null }
}, { timestamps: true });

const MeetingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  jitsiUrl: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  durationMinutes: { type: Number, default: 120 },
  assignedEmployeeIds: { type: [String], default: [] },
  autoMute: { type: Boolean, default: true },
  staggeredDelay: { type: Boolean, default: true },
  status: { type: String, default: 'scheduled' },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

const IpPoolSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  ip: { type: String, required: true },
  city: { type: String, default: 'Madrid' },
  region: { type: String, default: 'Comunidad de Madrid' },
  isp: { type: String, default: 'Telefónica de España' }
}, { timestamps: true });

const Company = mongoose.model('Company', CompanySchema);
const Course = mongoose.model('Course', CourseSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const Meeting = mongoose.model('Meeting', MeetingSchema);
const IpPool = mongoose.model('IpPool', IpPoolSchema);

let isConnected = false;

async function connectMongo() {
  if (isConnected) return true;
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 12000
    });
    isConnected = true;
    console.log(`[MongoDB] ✅ Conectado exitosamente a la base de datos: "${mongoose.connection.name}"`);
    return true;
  } catch (err) {
    console.error(`[MongoDB] ⚠️ Error al conectar con MongoDB (${err.message}). Usando respaldo local en disco.`);
    isConnected = false;
    return false;
  }
}

module.exports = {
  connectMongo,
  isConnected: () => isConnected,
  Company,
  Course,
  Employee,
  Meeting,
  IpPool,
  mongoose
};
