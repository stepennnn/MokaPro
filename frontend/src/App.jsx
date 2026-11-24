import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';

// Import halaman
import Welcome from './pages/Welcome/Welcome';
import SelectUser from './pages/SelectUser/SelectUser';
import CashierPin from './pages/CashierPin/CashierPin';
import BaristaPin from './pages/BaristaPin/BaristaPin';
import AdminPin from './pages/AdminPin/AdminPin';

import Cashier from './pages/Cashier/Cashier';
import KDS from './pages/KDS/KDS';
import Admin from './pages/Admin/Admin';
import History from './pages/History/History';
import Shift from './pages/Shift/Shift';
import Inventory from './pages/Admin/Inventory';
import Menu from './pages/Admin/Menu';
import Reports from './pages/Admin/Reports';

const roleHome = {
  cashier: '/cashier',
  barista: '/kds',
  admin: '/admin',
};

function ProtectedRoute({ allowedRoles, children }) {
  const { user, role, loading, error, refresh } = useAuth();

  if (loading) {
    return <p role="status">Memeriksa sesi...</p>;
  }

  if (error) {
    return (
      <main>
        <p role="alert">{error.message || 'Sesi tidak dapat diverifikasi.'}</p>
        <button type="button" onClick={refresh}>Coba lagi</button>
      </main>
    );
  }

  if (!user || !role) {
    return <Navigate to="/select-user" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={roleHome[role] || '/select-user'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/select-user" element={<SelectUser />} />
        <Route path="/cashier/pin" element={<CashierPin />} />
        <Route path="/barista/pin" element={<BaristaPin />} />
        <Route path="/admin/pin" element={<AdminPin />} />

        <Route path="/cashier" element={(
          <ProtectedRoute allowedRoles={['cashier']}>
            <Cashier />
          </ProtectedRoute>
        )} />
        <Route path="/history" element={(
          <ProtectedRoute allowedRoles={['cashier', 'admin']}>
            <History />
          </ProtectedRoute>
        )} />
        <Route path="/cashier/shift" element={(
          <ProtectedRoute allowedRoles={['cashier']}>
            <Shift />
          </ProtectedRoute>
        )} />
        <Route path="/kds" element={(
          <ProtectedRoute allowedRoles={['barista']}>
            <KDS />
          </ProtectedRoute>
        )} />
        <Route path="/admin" element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <Admin />
          </ProtectedRoute>
        )} />
        <Route path="/admin/inventory" element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <Inventory />
          </ProtectedRoute>
        )} />
        <Route path="/admin/menu" element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <Menu />
          </ProtectedRoute>
        )} />
        <Route path="/admin/reports" element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <Reports />
          </ProtectedRoute>
        )} />
      </Routes>
    </AuthProvider>
  );
}