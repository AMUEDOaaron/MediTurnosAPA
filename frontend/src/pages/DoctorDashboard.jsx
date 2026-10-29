import { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  Calendar, UserCheck, Clock, CheckCircle, XCircle,
  FileText, AlertCircle, Home, Users, Building2,
  Stethoscope, LogOut, Menu
} from 'lucide-react';

export const DoctorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const cargarTurnos = async () => {
    try {
      setLoading(true);
      const res = await API.get('/turnos/');
      setTurnos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTurnos();
  }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await API.patch(`/turnos/${id}/`, { estado: nuevoEstado });
      cargarTurnos();
    } catch {
      alert('Error al actualizar el estado del turno');
    }
  };

  const pendientes = turnos.filter(t => t.estado === 'PENDIENTE').length;
  const atendidos = turnos.filter(t => t.estado === 'ATENDIDO').length;

  const menuItems = [
    { id: 'inicio', label: 'Mi Agenda', icon: Home },
    { id: 'pacientes', label: 'Pacientes', icon: Users },
    { id: 'obras', label: 'Obras Sociales', icon: Building2 },
    { id: 'historial', label: 'Historial clínico', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-brand-soft flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-brand-border transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <div className="p-4 border-b border-brand-border flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-brand-text text-sm">Medi-Turnos</p>
            <p className="text-xs text-brand-textSoft">Área Profesional</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setSection(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-brand-greenLight text-brand-green border-l-4 border-brand-green'
                    : 'text-brand-textSoft hover:bg-brand-soft'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-brand-border">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-brand-border sticky top-0 z-20 px-4 py-3 flex items-center gap-4">
          <button className="md:hidden p-2 rounded-lg hover:bg-brand-soft" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-brand-text" />
          </button>

          <div className="flex-1">
            <p className="text-xs font-semibold text-brand-green uppercase tracking-wide">Área Profesional</p>
            <h1 className="text-lg font-bold text-brand-text">Mi agenda</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-brand-greenLight text-brand-green px-3 py-1.5 rounded-full text-sm font-semibold border border-brand-border">
              <Stethoscope className="h-4 w-4" />
              {user?.first_name || 'Dr/a'} {user?.last_name || ''}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* Welcome + Stats */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-brand-text">
                Buenos días, {user?.first_name || 'Doctor/a'}
              </h2>
              <p className="text-sm text-brand-textSoft">Resumen de actividad del consultorio</p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-brand-border p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-brand-textSoft uppercase">Turnos de hoy</p>
                  <p className="text-3xl font-bold text-brand-text mt-1">{turnos.length}</p>
                </div>
                <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-brand-border p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-brand-textSoft uppercase">Atendidos</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{atendidos}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-brand-border p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-brand-textSoft uppercase">Pendientes</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">{pendientes}</p>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Agenda */}
          <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-brand-border bg-brand-soft/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-brand-text">Agenda de hoy</h3>
                <p className="text-xs text-brand-textSoft">Turnos programados e interactivos</p>
              </div>
              <span className="text-xs bg-brand-greenLight text-brand-green px-2.5 py-1 rounded-full font-semibold">
                {turnos.length} citas
              </span>
            </div>

            <div className="p-4">
              {loading ? (
                <p className="text-center py-10 text-brand-textSoft">Cargando turnos...</p>
              ) : turnos.length === 0 ? (
                <div className="text-center py-12 text-brand-textSoft">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No hay turnos registrados</p>
                  <p className="text-xs mt-1">Los turnos solicitados por pacientes aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {turnos.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-brand-border bg-brand-soft/30 hover:bg-white hover:shadow-sm transition"
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-brand-green text-white font-bold text-sm px-3 py-2 rounded-lg min-w-[70px] text-center">
                          {new Date(t.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-text">{t.paciente_nombre || 'Paciente'}</p>
                          <p className="text-xs text-brand-textSoft mt-0.5">
                            {new Date(t.fecha_hora).toLocaleDateString('es-AR')}
                            {t.motivo_consulta && ` · ${t.motivo_consulta}`}
                          </p>
                          <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            t.estado === 'ATENDIDO' ? 'bg-emerald-100 text-emerald-700' :
                            t.estado === 'CANCELADO' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {t.estado}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => cambiarEstado(t.id, 'ATENDIDO')}
                          className="flex items-center gap-1 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold px-3 py-2 rounded-lg transition"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Atender
                        </button>
                        <button
                          onClick={() => cambiarEstado(t.id, 'CANCELADO')}
                          className="flex items-center gap-1 text-xs bg-red-100 hover:bg-red-200 text-red-800 font-semibold px-3 py-2 rounded-lg transition"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancelar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};