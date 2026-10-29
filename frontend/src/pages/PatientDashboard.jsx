import { useState, useEffect } from 'react';
import API from '../services/api';
import { Calendar, Search, User, Clock, CheckCircle } from 'lucide-react';

export const PatientDashboard = () => {
  const [turnos, setTurnos] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [medicoSeleccionado, setMedicoSeleccionado] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargarTurnos = () => {
    API.get('/turnos/').then((res) => setTurnos(res.data));
    API.get('/medicos/').then((res) => setMedicos(res.data));
  };

  useEffect(() => { cargarTurnos(); }, []);

  const handleReservar = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      await API.post('/turnos/', {
        medico: medicoSeleccionado,
        fecha_hora: fechaHora,
        motivo_consulta: motivo
      });
      setMensaje('¡Turno reservado correctamente!');
      setMedicoSeleccionado('');
      setFechaHora('');
      setMotivo('');
      cargarTurnos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la reserva del turno.');
    }
  };

  const medicosFiltrados = medicos.filter(m => 
    !filtroEspecialidad || (m.especialidad_nombre && m.especialidad_nombre.toLowerCase().includes(filtroEspecialidad.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Portal del Paciente</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Reserva */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-sky-600" /> Solicitar Nuevo Turno
          </h2>

          {mensaje && <div className="bg-emerald-50 text-emerald-700 p-3 rounded text-sm mb-4 border border-emerald-200">{mensaje}</div>}
          {error && <div className="bg-rose-50 text-rose-700 p-3 rounded text-sm mb-4 border border-rose-200">{error}</div>}

          <form onSubmit={handleReservar} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Filtrar Especialidad</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ej: Cardiología..."
                  value={filtroEspecialidad}
                  onChange={(e) => setFiltroEspecialidad(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Seleccionar Médico</label>
              <select
                required
                value={medicoSeleccionado}
                onChange={(e) => setMedicoSeleccionado(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="">-- Elija un Profesional --</option>
                {medicosFiltrados.map((m) => (
                  <option key={m.id} value={m.id}>
                    Dr/a. {m.usuario?.first_name} {m.usuario?.last_name} ({m.especialidad_nombre})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Fecha y Hora</label>
              <input
                type="datetime-local"
                required
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Motivo de Consulta</label>
              <textarea
                rows="3"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Indique brevemente el motivo..."
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              ></textarea>
            </div>

            <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 rounded-lg text-sm transition">
              Confirmar Reserva
            </button>
          </form>
        </div>

        {/* Historial y Próximos Turnos */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Mis Turnos Agendados</h2>
          <div className="space-y-3">
            {turnos.length === 0 ? (
              <p className="text-slate-500 text-sm">No posee turnos agendados en este momento.</p>
            ) : (
              turnos.map((t) => (
                <div key={t.id} className="p-4 border rounded-xl flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <p className="font-bold text-slate-800">{t.medico_nombre} <span className="text-sky-600 font-normal">({t.especialidad_nombre})</span></p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Clock className="h-3.5 w-3.5" /> {new Date(t.fecha_hora).toLocaleString('es-AR')}
                    </p>
                    {t.motivo_consulta && <p className="text-xs text-slate-600 mt-1">Motivo: {t.motivo_consulta}</p>}
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                    {t.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
