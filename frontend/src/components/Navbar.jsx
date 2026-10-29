import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Calendar, User } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <nav className="bg-brand-green text-white shadow-md px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="bg-white rounded-lg p-1.5">
          <Calendar className="h-5 w-5 text-brand-green" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-wide">Medi-Turnos</span>
          <p className="text-xs text-green-100 opacity-90 -mt-0.5">Sistema de gestión médica</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm bg-brand-greenDark/40 px-3 py-1.5 rounded-full border border-white/20">
          <User className="h-4 w-4" />
          <span>
            {user.first_name || user.username}
            <span className="ml-1 opacity-80 text-xs">({user.rol})</span>
          </span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition border border-white/20"
        >
          <LogOut className="h-4 w-4" />
          <span>Salir</span>
        </button>
      </div>
    </nav>
  );
};