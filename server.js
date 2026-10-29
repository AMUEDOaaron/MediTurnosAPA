require('dotenv').config(); // <-- CARGA LAS VARIABLES DEL ARCHIVO .env


const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer'); // <-- NUEVO PARA CORREOS

const app = express();

// ==========================================
// CONFIGURACIÓN DE NOTIFICACIONES (EMAIL)
// ==========================================
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASS
  }
});
const PORT = process.env.PORT || 3000;

// ========== CONFIGURACIÓN DE MULTER (ALMACENAMIENTO DE ARCHIVOS) ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `estudio-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB por archivo
});

// ========== MIDDLEWARES GENERALES ==========
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir la carpeta de subidas y la raíz para los HTML
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

// ========== BASE DE DATOS SIMPLE (JSON) ==========
const DB_FILE = path.join(__dirname, 'database.json');

const DEFAULT_USERS = [
  {
    id: 1,
    usuario: 'admin',
    password: '1234',
    pass: '1234',
    rol: 'admin',
    nombre: 'Administrador Master',
    email: 'admin@mediturnos.com'
  },
  {
    id: 2,
    usuario: 'secretaria',
    password: '1234',
    pass: '1234',
    rol: 'secretaria',
    nombre: 'Secretaría',
    email: 'secretaria@mediturnos.com'
  },
  {
    id: 3,
    usuario: 'doctora',
    password: '1234',
    pass: '1234',
    rol: 'profesional',
    nombre: 'Dra. María González',
    especialidad: 'Dermatología',
    matricula: 'MP 12345',
    email: 'maria.gonzalez@mediturnos.com'
  },
  {
    id: 5,
    usuario: 'paciente',
    password: '1234',
    pass: '1234',
    rol: 'paciente',
    nombre: 'Juan Pérez',
    dni: '32456789',
    obra: 'OSDE',
    telefono: '11 5555-1234',
    email: 'juan.perez@mail.com'
  }
];

function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (!data.usuarios) data.usuarios = DEFAULT_USERS;
      if (!data.turnos) data.turnos = [];
      if (!data.pacientes) data.pacientes = [
        {
          id: 1,
          nombre: 'Juan Pérez',
          dni: '32456789',
          obra: 'OSDE',
          telefono: '11 5555-1234',
          email: 'juan.perez@mail.com',
          estado: 'Habilitado'
        }
      ];
      if (!data.obras) data.obras = [];
      if (!data.hc) data.hc = [];
      if (!data.contactos) data.contactos = [];
      return data;
    } catch (e) {
      console.log('Error leyendo DB, se crea una nueva...');
    }
  }
  const db = {
    usuarios: DEFAULT_USERS,
    turnos: [],
    pacientes: [
      {
        id: 1,
        nombre: 'Juan Pérez',
        dni: '32456789',
        obra: 'OSDE',
        telefono: '11 5555-1234',
        email: 'juan.perez@mail.com',
        estado: 'Habilitado'
      }
    ],
    obras: [],
    hc: [],
    contactos: []
  };
  saveDB(db);
  return db;
}

function saveDB(dbData) {
  // Cada guardado sube la versión: así secretaría y profesional detectan cambios
  dbData.version = (Number(dbData.version) || 0) + 1;
  dbData.ultimaActualizacion = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
}

let db = loadDB();

// ========== CONFIGURACIÓN DE AGENDA COMPARTIDA (ACTUALIZACIONES) ==========
// Valores por defecto: los mismos que usan secretaria.html y profesionales.html
const DEFAULT_CONFIG_TURNOS = {
  'Primera consulta': 30,
  'Control': 15,
  'Seguimiento': 15,
  'Urgencia/Prioritario': 20,
  'Práctica': 45,
  'Cirugía': 120,
  'Otros': 30
};
const DEFAULT_CONFIG_MOTIVOS = ['Control general', 'Primera vez', 'Urgencia', 'Receta', 'Otro'];
const DEFAULT_CONFIG_AGENDA = {
  1: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }],
  2: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }],
  3: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }],
  4: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }],
  5: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }],
  6: [],
  0: []
};

function obtenerConfigTurnos() {
  return (db.configTurnos && Object.keys(db.configTurnos).length) ? db.configTurnos : DEFAULT_CONFIG_TURNOS;
}
function obtenerConfigMotivos() {
  return (Array.isArray(db.configMotivos) && db.configMotivos.length) ? db.configMotivos : DEFAULT_CONFIG_MOTIVOS;
}
function obtenerConfigAgenda() {
  return (db.configAgenda && Object.keys(db.configAgenda).length) ? db.configAgenda : DEFAULT_CONFIG_AGENDA;
}

function horaAMinutos(h) {
  if (!h) return 0;
  const [hh, mm] = String(h).split(':').map(Number);
  return (hh || 0) * 60 + (mm || 0);
}
function minutosAHora(m) {
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}
function fechaLocalServidor(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function lunesDeLaSemana(fechaStr) {
  const [y, m, d] = fechaStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dia = dt.getDay();
  dt.setDate(dt.getDate() - dia + (dia === 0 ? -6 : 1));
  return fechaLocalServidor(dt);
}
// Igual que getAgendaForDate() del front: primero la semana puntual, si no la agenda estándar
function agendaParaFecha(fechaStr) {
  const semanas = db.configAgendaSemanas || {};
  return semanas[lunesDeLaSemana(fechaStr)] || obtenerConfigAgenda();
}
// Cancelado / Finalizado / Atendido liberan el horario (misma regla que secretaría)
function estadoOcupaHorario(estado) {
  const e = String(estado || '').toLowerCase().trim();
  return e !== 'cancelado' && e !== 'finalizado' && e !== 'atendido';
}
function seSuperpone(t, inicio, fin) {
  const s = horaAMinutos(t.hora);
  const e = t.horaHasta ? horaAMinutos(t.horaHasta) : s + 30;
  return inicio < e && s < fin;
}

// ========== RUTAS API PARA ARCHIVOS Y DATOS ==========

// Subida de adjuntos/estudios
app.post('/api/upload', upload.single('archivo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', mensaje: 'No se subió ningún archivo' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ status: 'ok', url: fileUrl, nombreOriginal: req.file.originalname });
});

app.get('/api/datos', (req, res) => {
  db = loadDB();
  res.json(db);
});

// Versión actual de los datos (consulta liviana para la sincronización automática)
app.get('/api/version', (req, res) => {
  res.json({ version: Number(db.version) || 0 });
});

// Permisos configurados en permisos.html (los leen pacientes, secretaría y profesional)
app.get('/api/permisos', (req, res) => {
  res.json(db.permisos || {});
});

// ¿El portal del paciente tiene habilitada esta función?
function permisoPaciente(clave) {
  const p = db.permisos || {};
  if (clave.startsWith('pac_turnos_') && p.main_pac_turnos === false) return false;
  if (clave.startsWith('pac_datos_') && p.main_pac_datos === false) return false;
  return p[clave] !== false;
}

app.post('/api/datos', (req, res) => {
  const { pacientes, turnos, obras, hc, contactos, usuarios, configMotivos, configTurnos, configAgenda, configAgendaSemanas, permisos } = req.body;

  // Permisos de la consola master (permisos.html)
  if (permisos && typeof permisos === 'object' && !Array.isArray(permisos)) db.permisos = permisos;

  // Configuración compartida (pestaña ACTUALIZACIONES)
  if (Array.isArray(configMotivos)) db.configMotivos = configMotivos;
  if (configTurnos && typeof configTurnos === 'object') db.configTurnos = configTurnos;
  if (configAgenda && typeof configAgenda === 'object') db.configAgenda = configAgenda;
  if (configAgendaSemanas && typeof configAgendaSemanas === 'object') db.configAgendaSemanas = configAgendaSemanas;
  
  if (pacientes) db.pacientes = pacientes;
  if (turnos) db.turnos = turnos;
  if (obras) db.obras = obras;
  if (hc) db.hc = hc;
  if (contactos) db.contactos = contactos;
  if (usuarios) {
    // Actualizamos los usuarios asegurando que pass, password y clave queden sincronizados a la nueva contraseña
    db.usuarios = usuarios.map(uNew => {
      const uExistente = db.usuarios.find(u => String(u.id) === String(uNew.id) || String(u.dni) === String(uNew.dni));
      const nuevaClave = uNew.password || uNew.pass || uNew.clave;
      if (uExistente && nuevaClave) {
                // 1. Primero fusionamos los datos (esto vuelve a meter tempPassword si viene del frontend)
                const usuarioFusionado = { ...uExistente, ...uNew };
                
                // 2. Aseguramos la nueva contraseña oficial en todos los campos
                usuarioFusionado.password = nuevaClave;
                usuarioFusionado.pass = nuevaClave;
                usuarioFusionado.clave = nuevaClave;
                
                // 3. Finalmente ELIMINAMOS de forma definitiva el provisorio del objeto fusionado
                delete usuarioFusionado.tempPassword;
                delete usuarioFusionado.tempPasswordExpires;
                
                return usuarioFusionado;
              }
      return uNew;
    });
  }

  saveDB(db);
  res.json({ success: true, message: 'Datos guardados correctamente', version: db.version });
});

// ========== RUTAS API TRADICIONALES ==========

// LOGIN POR USUARIO / DNI
const handleLogin = (req, res) => {
  const usuarioInput = (req.body.usuario || req.body.dni || '').trim().toLowerCase();
  const password = req.body.password;
  const rol = req.body.rol;

  if (!usuarioInput || !password) {
    return res.status(400).json({ ok: false, mensaje: 'Usuario/DNI y contraseña son obligatorios' });
  }

  const user = db.usuarios.find(u => {
    const coincideUsuario = u.usuario && u.usuario.toString().toLowerCase() === usuarioInput;
    const coincideDni = u.dni && u.dni.toString().toLowerCase() === usuarioInput;
    const coincideClave = (u.password === password || u.pass === password);
    const coincideRol = !rol || u.rol === rol || (rol === 'profesional' && u.rol === 'profesional');

    return (coincideUsuario || coincideDni) && coincideClave && coincideRol;
  });

  if (!user) {
    return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
  }

  const { password: _, pass: __, ...usuarioSinPass } = user;
  res.json({
    ok: true,
    mensaje: 'Login exitoso',
    usuario: usuarioSinPass,
    nombre: user.nombre,
    dni: user.dni || user.usuario,
    redirect: 'pacientes.html'
  });
};

app.post('/api/login', handleLogin);
app.post('/api/pacientes/login', handleLogin);

// CAMBIAR CONTRASEÑA DE PACIENTES
app.post('/api/pacientes/cambiar-password', (req, res) => {
  const { dni, passActual, passNueva } = req.body;

  if (!permisoPaciente('main_pac_password')) {
    return res.status(403).json({ mensaje: 'El cambio de contraseña no está habilitado.' });
  }

  if (!dni || !passActual || !passNueva) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  const dniStr = dni.toString().toLowerCase();

  const usuarioEncontrado = db.usuarios.find(u => 
    (u.dni && u.dni.toString().toLowerCase() === dniStr) || 
    (u.usuario && u.usuario.toString().toLowerCase() === dniStr)
  );

  if (!usuarioEncontrado) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado en el servidor.' });
  }

  const claveGuardada = usuarioEncontrado.password || usuarioEncontrado.pass;
  if (claveGuardada !== passActual) {
    return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta.' });
  }

  // Actualizamos a la nueva clave en todas sus variables
  usuarioEncontrado.password = passNueva;
  usuarioEncontrado.pass = passNueva;
  usuarioEncontrado.clave = passNueva;

  // Destruimos la contraseña temporal para invalidarla automáticamente
  delete usuarioEncontrado.tempPassword;
  delete usuarioEncontrado.tempPasswordExpires;

  saveDB(db);

  console.log(`[OK] Contraseña actualizada correctamente para el DNI: ${dni}`);
  return res.status(200).json({ mensaje: 'Contraseña actualizada con éxito.' });
});

// RECUPERAR CONTRASEÑA (ENVÍO DE EMAIL PROVISORIO CON VIGENCIA DE 3 DÍAS)
app.post('/api/recuperar-password', async (req, res) => {
  const { dni, email } = req.body;
  
  if (!dni || !email) {
    return res.status(400).json({ ok: false, mensaje: 'DNI y Correo Electrónico son obligatorios.' });
  }

  const dniStr = dni.toString().trim().toLowerCase();
  const emailStr = email.trim().toLowerCase();

  // 1. Buscar si el usuario existe en la base de datos
  let usuario = db.usuarios.find(u => 
    (u.dni && u.dni.toString().trim().toLowerCase() === dniStr) || 
    (u.usuario && u.usuario.toString().trim().toLowerCase() === dniStr)
  );

  if (!usuario) {
    return res.status(404).json({ ok: false, mensaje: 'No se encontró un usuario registrado con ese DNI.' });
  }

  // 2. Verificar que el email coincida con su cuenta 
  const pacienteEncontrado = db.pacientes.find(p => p.dni && p.dni.toString() === dniStr);
  const emailGuardado = pacienteEncontrado ? (pacienteEncontrado.email || '').trim().toLowerCase() : (usuario.email || '').trim().toLowerCase();

  if (emailGuardado && emailGuardado !== emailStr) {
    return res.status(403).json({ ok: false, mensaje: 'El correo ingresado no coincide con el registrado en tu cuenta.' });
  }

  if (!usuario.email) {
    usuario.email = emailStr;
  }
  if (pacienteEncontrado && !pacienteEncontrado.email) {
    pacienteEncontrado.email = emailStr;
  }

  // 3. Generar contraseña provisoria de 6 caracteres, reemplazar la clave actual y configurar vigencia de 3 días
  const tempPass = Math.random().toString(36).slice(-6).toUpperCase();
  const ahora = Date.now();
  const tresDiasMs = 3 * 24 * 60 * 60 * 1000;

  usuario.password = tempPass;
  usuario.pass = tempPass;
  usuario.tempPassword = tempPass;
  usuario.tempPasswordExpires = ahora + tresDiasMs;
  
  saveDB(db);

  // 4. Enviar el correo de recuperación
  if (GMAIL_USER && GMAIL_APP_PASS) {
    try {
      await transporter.sendMail({
        from: `"Medi-Turnos" <${GMAIL_USER}>`,
        to: emailStr,
        subject: 'Recuperación de Contraseña - Medi-Turnos',
        text: `Hola ${usuario.nombre || 'Usuario'}, tu contraseña provisoria es: ${tempPass}. Válida por 3 días.`,
        html: `
          <div style="font-family: sans-serif; color: #1a2e22; padding: 20px;">
            <h2>Hola ${usuario.nombre || 'Usuario'}</h2>
            <p>Has solicitado recuperar tu acceso al portal de <strong>Medi-Turnos</strong>.</p>
            <p>Tu contraseña provisoria es:</p>
            <h3 style="background: #e2e8f0; padding: 10px 15px; display: inline-block; letter-spacing: 2px; font-family: monospace;">${tempPass}</h3>
            <p>⚠️ <strong>IMPORTANTE:</strong> Esta contraseña provisoria tiene una validez de <strong>3 días</strong>. Por seguridad, te recomendamos iniciar sesión y cambiarla.</p>
          </div>
        `
      });
      console.log(`✅ Contraseña provisoria enviada a ${emailStr} para el DNI ${dni}`);
      return res.status(200).json({ ok: true, mensaje: 'Clave enviada exitosamente.' });
    } catch (error) {
      console.error('❌ Error enviando email de recuperación:', error);
      return res.status(500).json({ ok: false, mensaje: 'No se pudo enviar el correo. Avisá al consultorio.' });
    }
  } else {
    console.error('⚠️ No se puede enviar el email porque falta el GMAIL_USER en .env');
    return res.status(500).json({ ok: false, mensaje: 'El sistema de correos no está configurado.' });
  }
});

// REGISTRO BÁSICO DE PACIENTE
app.post('/api/pacientes', (req, res) => {
  const { nombre, dni, obra, telefono, password } = req.body;

  if (!nombre || !dni) {
    return res.status(400).json({ ok: false, mensaje: 'Nombre y DNI son obligatorios' });
  }

  const existe = db.usuarios.find(u => 
    (u.dni && u.dni.toString() === dni.toString()) || 
    (u.usuario && u.usuario.toString() === dni.toString())
  );

  if (existe) {
    return res.status(400).json({ ok: false, mensaje: 'Ya existe un usuario registrado con ese DNI' });
  }

  const nuevoId = db.usuarios.length ? Math.max(...db.usuarios.map(u => u.id)) + 1 : 1;
  
  const nuevoUsuario = {
    id: nuevoId,
    usuario: dni,
    password: password || '1234',
    pass: password || '1234',
    rol: 'paciente',
    nombre,
    dni,
    obra: obra || 'Particular',
    telefono: telefono || '',
    email: ''
  };

  db.usuarios.push(nuevoUsuario);
  db.pacientes.push({
    id: nuevoId,
    nombre,
    dni,
    obra: obra || 'Particular',
    telefono: telefono || '',
    estado: 'Habilitado'
  });

  saveDB(db);

  const { password: _, pass: __, ...sinPass } = nuevoUsuario;
  res.status(201).json({ ok: true, mensaje: 'Paciente registrado correctamente', usuario: sinPass });
});

// REGISTRO COMPLETO / MODIFICACIÓN DE PACIENTE
app.post('/api/pacientes/registro-completo', (req, res) => {
  const datos = req.body;
  const dni = datos.numDoc || datos.dni;

  let pacienteExistente = db.pacientes.find(p => p.dni === dni);
  if (pacienteExistente) {
    Object.assign(pacienteExistente, datos, { nombre: `${datos.nombre} ${datos.apellido}`.trim() });
  } else {
    db.pacientes.push({
      id: db.pacientes.length ? Math.max(...db.pacientes.map(p => p.id)) + 1 : 1,
      ...datos,
      nombre: `${datos.nombre} ${datos.apellido}`.trim(),
      dni: dni,
      estado: 'Habilitado'
    });
  }

  saveDB(db);
  res.json({ ok: true, message: 'Datos personales guardados correctamente' });
});

// LISTAR TURNOS
app.get('/api/turnos', (req, res) => {
  res.json(db.turnos);
});

// DISPONIBILIDAD PARA EL PORTAL DEL PACIENTE (config de Actualizaciones + horarios ocupados, sin datos personales)
app.get('/api/disponibilidad', (req, res) => {
  db = loadDB();
  res.json({
    version: Number(db.version) || 0,
    configTurnos: obtenerConfigTurnos(),
    configMotivos: obtenerConfigMotivos(),
    configAgenda: obtenerConfigAgenda(),
    configAgendaSemanas: db.configAgendaSemanas || {},
    ocupados: (db.turnos || [])
      .filter(t => estadoOcupaHorario(t.estado))
      .map(t => ({
        fecha: t.fecha,
        hora: t.hora,
        horaHasta: t.horaHasta || '',
        motivo: t.motivo === 'Día Bloqueado' ? 'Día Bloqueado' : ''
      }))
  });
});

// CREAR TURNO Y ENVIAR NOTIFICACIONES
app.post('/api/turnos', async (req, res) => {
  console.log('\n=============================================');
  console.log('📩 [PETICIÓN DE TURNO RECIBIDA IN]');
  console.log('Datos en req.body:', req.body);
  
  const { paciente, profesional, fecha, hora, motivo, email, tipoConsulta, observaciones, obra, dni } = req.body;

  if (!permisoPaciente('pac_turnos_agregar')) {
    return res.status(403).json({ ok: false, mensaje: 'La solicitud de turnos online no está habilitada en este momento.' });
  }

  if (!paciente || !fecha || !hora || !tipoConsulta || !motivo) {
    console.log('❌ Error: Faltan datos obligatorios');
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos del turno (fecha, hora, tipo de consulta o motivo).' });
  }

  // 1. Tipo y motivo deben ser los cargados en ACTUALIZACIONES
  const configTurnos = obtenerConfigTurnos();
  if (configTurnos[tipoConsulta] === undefined) {
    return res.status(400).json({ ok: false, mensaje: 'El tipo de consulta elegido ya no está disponible.' });
  }
  if (!obtenerConfigMotivos().includes(motivo)) {
    return res.status(400).json({ ok: false, mensaje: 'El motivo de consulta elegido ya no está disponible.' });
  }

  // 2. No se permiten fechas u horarios pasados
  const ahora = new Date();
  const hoy = fechaLocalServidor(ahora);
  const inicio = horaAMinutos(hora);
  const duracion = Number(configTurnos[tipoConsulta]) || 30;
  const fin = inicio + duracion;
  if (fecha < hoy || (fecha === hoy && inicio <= ahora.getHours() * 60 + ahora.getMinutes())) {
    return res.status(400).json({ ok: false, mensaje: 'No se pueden pedir turnos en fechas u horarios pasados.' });
  }

  // 3. Debe caer dentro de los días y horarios de atención configurados
  const diaSemana = new Date(fecha + 'T00:00:00').getDay();
  const rangos = agendaParaFecha(fecha)[diaSemana] || [];
  const dentroDeAgenda = rangos.some(r => inicio >= horaAMinutos(r.start) && fin <= horaAMinutos(r.end));
  if (!dentroDeAgenda) {
    return res.status(409).json({ ok: false, mensaje: 'El consultorio no atiende en ese día u horario.' });
  }

  // 4. No puede superponerse con otro turno ni con un día bloqueado (de cualquier pantalla)
  const ocupado = db.turnos.some(t => t.fecha === fecha && estadoOcupaHorario(t.estado) && seSuperpone(t, inicio, fin));
  if (ocupado) {
    return res.status(409).json({ ok: false, mensaje: 'Ese horario acaba de ser reservado. Elegí otro horario libre.' });
  }

  const nuevoTurno = {
    id: db.turnos.length ? Math.max(...db.turnos.map(t => Number(t.id) || 0)) + 1 : 1,
    fecha,
    hora,
    horaHasta: minutosAHora(fin),
    paciente,
    dni: dni || '',
    obra: obra || 'Particular',
    profesional: profesional || 'Dra. María González',
    tipoEvento: 'Consulta',
    tipoConsulta,
    motivoPaciente: motivo,
    motivo: `${motivo} (${tipoConsulta})`, // mismo formato que usan secretaría y profesional
    observaciones: String(observaciones || '').replace(/[<>]/g, '').trim().slice(0, 500),
    medioSolicitud: 'Web',
    estado: 'Pendiente',
    creado: new Date().toISOString()
  };

  db.turnos.push(nuevoTurno);
  saveDB(db);

  let notificaciones = { email: false };

  // --- LÓGICA DE NOTIFICACIÓN DE EMAIL ---
  if (!GMAIL_USER || !GMAIL_APP_PASS) {
    console.log('⚠️ ALERTA: No se enviaron correos porque faltan configurar GMAIL_USER o GMAIL_APP_PASS en el archivo .env.');
  } else {
    try {
      // 1. Enviar correo al PACIENTE informando la solicitud (con fecha y doctor)
      if (email) {
        console.log(`📧 Intentando enviar correo al paciente: ${email}...`);
        await transporter.sendMail({
          from: `"Medi-Turnos" <${GMAIL_USER}>`,
          to: email,
          subject: 'Solicitud de turno médico',
          text: `Hola ${paciente}, se solicitó un turno para la fecha ${fecha} a las ${hora} hs con el doctor ${nuevoTurno.profesional}.`,
          html: `<div style="font-family: sans-serif; padding: 20px; color: #1a2e22;">
                   <p>Hola <strong>${paciente}</strong>,</p>
                   <p>Te confirmamos que <strong>se solicitó un turno</strong> con éxito.</p>
                   <ul style="background: #e8f5ee; padding: 15px; border-radius: 8px; list-style: none;">
                     <li>🗓️ <strong>Fecha:</strong> ${fecha} a las ${hora} hs</li>
                     <li>🩺 <strong>Doctor/a:</strong> ${nuevoTurno.profesional}</li>
                   </ul>
                   <p>¡Te esperamos en el consultorio!</p>
                 </div>`
        });
        notificaciones.email = true;
        console.log('✅ Correo enviado al paciente con éxito.');
      } else {
        console.log('⚠️ No se envió email al paciente porque no tiene correo registrado.');
      }

      // 2. Enviar correo de aviso al CONSULTORIO (Doctor/Secretaria)
      console.log(`📧 Intentando enviar correo de aviso interno al consultorio...`);
      await transporter.sendMail({
        from: `"Medi-Turnos Sistema" <${GMAIL_USER}>`,
        to: GMAIL_USER, // Envía a la misma casilla de correo configurada para recibir el aviso
        subject: `Nuevo turno solicitado: ${paciente}`,
        text: `El paciente ${paciente} solicitó un turno con el doctor ${nuevoTurno.profesional} para la fecha ${fecha} a las ${hora} hs.`,
        html: `<div style="font-family: sans-serif; padding: 15px; border: 1px solid #b7d4c4; border-radius: 8px;">
                 <h2 style="color: #1a7a4c;">Nuevo turno solicitado</h2>
                 <p>Un paciente acaba de solicitar un turno desde la plataforma online:</p>
                 <ul>
                   <li><strong>Paciente:</strong> ${paciente}</li>
                   <li><strong>Doctor/a:</strong> ${nuevoTurno.profesional}</li>
                   <li><strong>Fecha:</strong> ${fecha}</li>
                   <li><strong>Hora:</strong> ${hora} hs</li>
                   <li><strong>Motivo:</strong> ${nuevoTurno.motivo}</li>
                   <li><strong>Observaciones del paciente:</strong> ${nuevoTurno.observaciones || '-'}</li>
                 </ul>
                 <p>El turno ya figura como <strong>Pendiente</strong> en la base de datos.</p>
               </div>`
      });
      console.log('✅ Correo de aviso interno enviado al consultorio con éxito.');

    } catch (error) {
      console.error('❌ ERROR AL ENVIAR EMAIL DESDE GMAIL:', error.message);
    }
  }

  console.log('=============================================\n');
  res.status(201).json({ ok: true, ...nuevoTurno, notificaciones });
});

// CANCELAR TURNO
app.post('/api/turnos/cancelar', (req, res) => {
  const { fecha, hora, paciente } = req.body;

  if (!permisoPaciente('pac_turnos_eliminar') && !permisoPaciente('pac_turnos_editar')) {
    return res.status(403).json({ ok: false, mensaje: 'La cancelación de turnos online no está habilitada.' });
  }
  const index = db.turnos.findIndex(t => t.fecha === fecha && t.hora === hora && t.paciente === paciente);
  if (index !== -1) {
    db.turnos[index].estado = 'Cancelado';
    saveDB(db);
    res.json({ ok: true, mensaje: 'Turno cancelado' });
  } else {
    res.status(404).json({ ok: false, mensaje: 'Turno no encontrado' });
  }
});

// ACTUALIZAR ESTADO DE TURNO
app.put('/api/turnos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const turno = db.turnos.find(t => t.id === id);
  if (!turno) return res.status(404).json({ mensaje: 'Turno no encontrado' });

  Object.assign(turno, req.body);
  saveDB(db);
  res.json(turno);
});

// LIMPIAR HISTORIAS CLÍNICAS
app.delete('/api/hc/limpiar-todas', (req, res) => {
  db = loadDB();
  db.hc = [];
  saveDB(db);
  res.json({ success: true, message: 'Todas las historias clínicas fueron eliminadas.' });
});

// LISTAR USUARIOS
app.get('/api/usuarios', (req, res) => {
  const usuariosSinPass = db.usuarios.map(({ password, pass, clave, tempPassword, tempPasswordExpires, ...u }) => u);
  res.json(usuariosSinPass);
});

// CREAR USUARIO (BÁSICO)
app.post('/api/usuarios', (req, res) => {
  const { usuario, password, rol, nombre } = req.body;
  if (!usuario || !password || !rol) {
    return res.status(400).json({ mensaje: 'Faltan datos' });
  }

  const existe = db.usuarios.find(u => u.usuario.toLowerCase() === usuario.toLowerCase());
  if (existe) return res.status(400).json({ mensaje: 'El usuario ya existe' });

  const nuevo = {
    id: db.usuarios.length ? Math.max(...db.usuarios.map(u => u.id)) + 1 : 1,
    usuario,
    password,
    pass: password,
    rol,
    nombre: nombre || usuario
  };
  db.usuarios.push(nuevo);
  saveDB(db);

  const { password: _, pass: __, ...sinPass } = nuevo;
  res.status(201).json(sinPass);
});

// CREACIÓN COMPLETA DE USUARIO DESDE CONSOLA MASTER CON ENVÍO DE CORREO AUTOMÁTICO (VIGENCIA 3 DÍAS)
app.post('/api/usuarios/crear-completo', async (req, res) => {
  const { usuario, user, nombre, dni, email, password, pass, role, rol, tempPassword, tempPasswordExpires, expiracion } = req.body;

  const dniFinal = (dni || usuario || '').trim();
  const nombreFinal = (user || nombre || '').trim();
  const passFinal = (password || pass || '').trim();
  const rolFinal = (role || rol || 'paciente').trim();
  const emailFinal = (email || '').trim().toLowerCase();

  if (!dniFinal || !nombreFinal || !passFinal || !emailFinal) {
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios (Nombre, DNI, Email y Contraseña).' });
  }

  // Verificar si ya existe un usuario con el mismo DNI o identificador
  const existe = db.usuarios.find(u => 
    (u.dni && u.dni.toString().trim().toLowerCase() === dniFinal.toLowerCase()) || 
    (u.usuario && u.usuario.toString().trim().toLowerCase() === dniFinal.toLowerCase())
  );

  if (existe) {
    return res.status(400).json({ ok: false, mensaje: 'Ya existe un usuario registrado con ese DNI o identificador.' });
  }

  const nuevoId = db.usuarios.length ? Math.max(...db.usuarios.map(u => u.id)) + 1 : 1;
  const expiracionMs = tempPasswordExpires || (Date.now() + (3 * 24 * 60 * 60 * 1000));

  const nuevoUsuario = {
    id: nuevoId,
    usuario: dniFinal,
    password: passFinal,
    pass: passFinal,
    rol: rolFinal,
    nombre: nombreFinal,
    dni: dniFinal,
    email: emailFinal,
    tempPassword: passFinal,
    tempPasswordExpires: expiracionMs,
    expiracion: expiracion || new Date(expiracionMs).toLocaleDateString('es-AR')
  };

  db.usuarios.push(nuevoUsuario);

  // Si es un paciente, agregarlo también a la lista de pacientes si no se encuentra registrado
  if (rolFinal === 'paciente') {
    const pacienteExiste = db.pacientes.find(p => p.dni && p.dni.toString() === dniFinal.toString());
    if (!pacienteExiste) {
      db.pacientes.push({
        id: db.pacientes.length ? Math.max(...db.pacientes.map(p => p.id)) + 1 : 1,
        nombre: nombreFinal,
        dni: dniFinal,
        obra: 'Particular',
        telefono: '',
        email: emailFinal,
        estado: 'Habilitado'
      });
    }
  }

  saveDB(db);

  // Envío automático del correo electrónico con las credenciales y la vigencia
  if (GMAIL_USER && GMAIL_APP_PASS) {
    try {
      await transporter.sendMail({
        from: `"Medi-Turnos Master Control" <${GMAIL_USER}>`,
        to: emailFinal,
        subject: 'Credenciales de Acceso - Medi-Turnos',
        text: `Hola ${nombreFinal}, tus accesos al sistema Medi-Turnos han sido generados. Tu usuario es ${dniFinal} y tu contraseña provisoria es: ${passFinal}. Válida por 3 días.`,
        html: `
          <div style="font-family: sans-serif; color: #1a2e22; padding: 20px; border: 1px solid #b7d4c4; border-radius: 8px;">
            <h2 style="color: #1a7a4c;">¡Bienvenido/a a Medi-Turnos, ${nombreFinal}!</h2>
            <p>Se ha generado tu cuenta con el rol de: <strong>${rolFinal.toUpperCase()}</strong>.</p>
            <p>Tus credenciales de acceso son:</p>
            <ul style="background: #f8faf9; padding: 15px; border-radius: 6px; list-style: none;">
              <li><strong>Usuario / DNI:</strong> <span style="font-family: monospace; background: #e5ebe8; padding: 2px 6px; border-radius: 4px;">${dniFinal}</span></li>
              <li><strong>Contraseña provisoria:</strong> <span style="font-family: monospace; background: #e5ebe8; padding: 2px 6px; border-radius: 4px;">${passFinal}</span></li>
            </ul>
            <p>⚠️ <strong>IMPORTANTE:</strong> Esta contraseña tiene una vigencia de <strong>3 días</strong>. Por seguridad, te recomendamos iniciar sesión y modificarla desde tu perfil.</p>
          </div>
        `
      });
      console.log(`✅ Credenciales enviadas por correo a ${emailFinal} (${dniFinal})`);
    } catch (error) {
      console.error('❌ Error al enviar el correo de alta de usuario:', error);
    }
  } else {
    console.log('⚠️ Usuario guardado, pero no se envió el correo porque faltan las credenciales de Gmail en el archivo .env');
  }

  const { password: _, pass: __, ...usuarioSinPass } = nuevoUsuario;
  return res.status(201).json({ ok: true, mensaje: 'Usuario creado y correo enviado con éxito', usuario: usuarioSinPass });
});

// ========== INICIALIZACIÓN DEL SERVIDOR ==========
app.listen(PORT, () => {
  console.log('');
  console.log('=============================================');
  console.log('   Medi-Turnos Backend corriendo');
  console.log('   http://localhost:' + PORT);
  console.log('=============================================');
  console.log('');
  console.log('LOGINS DISPONIBLES (todos con password: 1234)');
  console.log('---------------------------------------------');
  console.log('   ADMIN      →   usuario: admin');
  console.log('   SECRETARIA →   usuario: secretaria');
  console.log('   DOCTORA    →   usuario: doctora');
  console.log('   PACIENTE   →   usuario: paciente (o por DNI)');
  console.log('---------------------------------------------');
  console.log('');
});