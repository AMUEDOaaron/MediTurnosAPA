import { useState, useEffect } from 'react';
import API from '../services/api';
import { Users, Calendar, Stethoscope, Plus, UserPlus, Settings, Activity } from 'lucide-react';

export const AdminDashboard = () => {
  const [medicos, setMedicos] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);

  useEffect(() => {
    API.get('/medicos/').then((res) => setMedicos(res.data));
    API.get('/turnos/').then((res) => setTurnos(res.data));
    API.get('/especialidades/').then((res) => setEspecialidades(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel Administrador - MediTurnos</h1>
          <p className="text-sm text-slate-500">Gestión global de la clínica, profesionales y agendas de turnos</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
            <UserPlus className="h-4 w-4" /> Alta Médico
          </button>
          <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
            <Plus className="h-4 w-4" /> Nueva Especialidad
          </button>
        </div>
      </div>

      {/* Tarjetas Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500">Turnos Hoy</p>
            <Calendar className="h-5 w-5 text-sky-600" />
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">{turnos.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500">Médicos Activos</p>
            <Stethoscope className="h-5 w-5 text-teal-600" />
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">{medicos.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500">Especialidades</p>
            <Activity className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">{especialidades.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500">Configuración</p>
            <Settings className="h-5 w-5 text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 mt-3">Obras Sociales / Horarios</p>
        </div>
      </div>

      {/* Tabla de Médicos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Directorio de Profesionales</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
                <th className="p-3">Médico</th>
                <th className="p-3">Especialidad</th>
                <th className="p-3">Matrícula</th>
                <th className="p-3">Email</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {medicos.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">Dr/a. {m.usuario?.first_name} {m.usuario?.last_name}</td>
                  <td className="p-3 text-sky-700 font-medium">{m.especialidad_nombre || 'General'}</td>
                  <td className="p-3 font-mono text-slate-500">{m.matricula}</td>
                  <td className="p-3 text-slate-500">{m.usuario?.email}</td>
                  <td className="p-3">
                    <button className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
