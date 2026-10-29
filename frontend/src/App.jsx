import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { useContext } from 'react';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-brand-textSoft">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <>
      {/* Solo mostramos Navbar en páginas que no tienen su propio layout */}
      {user && !['/admin', '/medico', '/paciente'].includes(window.location.pathname) && <Navbar />}
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={
          <PrivateRoute roles={['ADMIN']}>
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/medico" element={
          <PrivateRoute roles={['MEDICO']}>
            <DoctorDashboard />
          </PrivateRoute>
        } />
        <Route path="/paciente" element={
          <PrivateRoute roles={['PACIENTE']}>
            <PatientDashboard />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;