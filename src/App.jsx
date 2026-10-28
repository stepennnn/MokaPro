import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome/Welcome';
import SelectUser from './pages/SelectUser/SelectUser';
import CashierPin from './pages/CashierPin/CashierPin';
import BaristaPin from './pages/BaristaPin/BaristaPin';
import AdminPin from './pages/AdminPin/AdminPin';
import Cashier from './pages/Cashier/Cashier';
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
    </Routes>
  );
}

export default App;
