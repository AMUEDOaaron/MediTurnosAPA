import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // === LOGIN TEMPORAL DE DESARROLLO ===
    // Cuando tengamos el backend correcto lo reemplazamos
    const usuarios = {
      'admin_mediturnos': { username: 'admin_mediturnos', first_name: 'Admin', last_name: 'Sistema', rol: 'ADMIN' },
      'dr_gonzalez':      { username: 'dr_gonzalez', first_name: 'Carlos', last_name: 'Gonzalez', rol: 'MEDICO' },
      'dra_perez':        { username: 'dra_perez', first_name: 'Maria', last_name: 'Perez', rol: 'MEDICO' },
      'juan_perez':       { username: 'juan_perez', first_name: 'Juan', last_name: 'Perez', rol: 'PACIENTE' },
      'lucia_gomez':      { username: 'lucia_gomez', first_name: 'Lucia', last_name: 'Gomez', rol: 'PACIENTE' },
    };

    const passOk = password === '1234' || password === 'Medico1234!' || password === 'Admin1234!' || password === 'Paciente1234!';

    if (usuarios[username] && passOk) {
      const userData = usuarios[username];
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', 'dev-token');
      setUser(userData);
      return userData;
    }

    throw new Error('Credenciales inválidas');
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};