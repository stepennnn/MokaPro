import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome/Welcome';
import SelectUser from './pages/SelectUser/SelectUser';
import CashierPin from './pages/CashierPin/CashierPin';
import BaristaPin from './pages/BaristaPin/BaristaPin';
import AdminPin from './pages/AdminPin/AdminPin';
import Cashier from './pages/Cashier/Cashier';
import KDS from './pages/KDS/KDS';
import Inventory from './pages/Inventory/Inventory';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import MenuManagement from './pages/MenuManagement/MenuManagement';
import Reports from './pages/Reports/Reports';
import TransactionHistory from './pages/TransactionHistory/TransactionHistory';
import ShiftReport from './pages/ShiftReport/ShiftReport';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/select-user" element={<SelectUser />} />
      <Route path="/cashier/pin" element={<CashierPin />} />
      <Route path="/barista/pin" element={<BaristaPin />} />
      <Route path="/admin/pin" element={<AdminPin />} />
      <Route path="/cashier" element={<Cashier />} />
      <Route path="/kds" element={<KDS />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/inventory" element={<Inventory />} />
      <Route path="/admin/menu" element={<MenuManagement />} />
      <Route path="/menu" element={<MenuManagement />} />
      <Route path="/admin/reports" element={<Reports />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/history" element={<TransactionHistory />} />
      <Route path="/cashier/shift" element={<ShiftReport />} />
    </Routes>
  );
}

export default App;
