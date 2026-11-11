import { Routes, Route } from 'react-router-dom';

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

export default function App() {
  return (
    <Routes>
      {/* 1. RUTE AWAL (INI YANG TADI HILANG) */}
      <Route path="/" element={<Welcome />} />
      <Route path="/select-user" element={<SelectUser />} />
      
      {/* 2. RUTE PIN */}
      <Route path="/cashier/pin" element={<CashierPin />} />
      <Route path="/barista/pin" element={<BaristaPin />} />
      <Route path="/admin/pin" element={<AdminPin />} />

      {/* 3. RUTE KASIR */}
      <Route path="/cashier" element={<Cashier />} />
      <Route path="/history" element={<History />} />
      <Route path="/cashier/shift" element={<Shift />} />

      {/* 4. RUTE BARISTA */}
      <Route path="/kds" element={<KDS />} />

      {/* 5. RUTE ADMIN */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/inventory" element={<Inventory />} />

      <Route path="/admin/menu" element={<Menu />} />
      <Route path="/admin/reports" element={<Reports />} />
    </Routes>
  );
}