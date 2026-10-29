import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Calendar } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(username, password);
      if (userData.rol === 'ADMIN') navigate('/admin');
      else if (userData.rol === 'MEDICO') navigate('/medico');
      else navigate('/paciente');
    } catch {
      setError('Credenciales inválidas. Verifique usuario y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-soft px-4">
      <div className="max-w-md w-full">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-green rounded-2xl shadow-lg mb-4">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-text">Medi-Turnos</h1>
          <p className="text-sm text-brand-textSoft mt-1">Sistema de gestión de turnos médicos</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-brand-border">
          <h2 className="text-xl font-bold text-center text-brand-text mb-1">Bienvenido</h2>
          <p className="text-sm text-center text-brand-textSoft mb-6">Ingresá tus credenciales para continuar</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-text mb-1.5">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-brand-textSoft" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition bg-brand-soft/50"
                  placeholder="Nombre de usuario"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-text mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-brand-textSoft" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition bg-brand-soft/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green hover:bg-brand-greenDark disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition duration-200 shadow-sm"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-xs text-brand-textSoft mt-6">
            Sistema seguro y confidencial
          </p>
        </div>
      </div>
    </div>
  );
};