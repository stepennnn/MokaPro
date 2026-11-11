import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import './Shift.css';

export default function Shift() {
  const [history, setHistory] = useState([]);

  // Ambil data transaksi asli dari localStorage
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('mokapro_history')) || [];
    setHistory(savedHistory);
  }, []);

  // 1. Hitung Total Penjualan
  const totalPenjualan = history.reduce((acc, curr) => acc + curr.total, 0);

  // 2. Hitung Total Transaksi
  const totalTransaksi = history.length;

  // 3. Cari Produk Terlaris
  const getProdukTerlaris = () => {
    if (history.length === 0) return { name: '-', qty: 0 };
    
    const itemCounts = {};
    history.forEach(order => {
      order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });

    let maxItem = '-';
    let maxQty = 0;
    for (const [name, qty] of Object.entries(itemCounts)) {
      if (qty > maxQty) {
        maxQty = qty;
        maxItem = name;
      }
    }
    return { name: maxItem, qty: maxQty };
  };

  const produkTerlaris = getProdukTerlaris();

  // 4. Pisahkan Pendapatan Tunai & QRIS
  const pendapatanTunai = history
    .filter(h => h.method === 'Tunai')
    .reduce((acc, curr) => acc + curr.total, 0);

  const pendapatanQRIS = history
    .filter(h => h.method === 'QRIS')
    .reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="shift-page">
      <DashboardNavbar role="cashier" userName="Kasir 01" userRoleLabel="Kasir" />
      <main className="shift-main">
        <h1 className="page-title">Rekapitulasi Shift Kasir</h1>

        {/* 4 Kartu Statistik Utama */}
        <div className="stats-grid">
          <div className="stat-card">
            <p>Penjualan Hari Ini</p>
            <h2>Rp {totalPenjualan.toLocaleString('id-ID')}</h2>
            <span className="stat-tag">Total keseluruhan</span>
          </div>
          <div className="stat-card">
            <p>Total Transaksi</p>
            <h2>{totalTransaksi} Pesanan</h2>
            <span className="stat-tag">Transaksi berhasil</span>
          </div>
          <div className="stat-card">
            <p>Produk Terlaris</p>
            <h2>{produkTerlaris.name}</h2>
            <span className="stat-tag">{produkTerlaris.qty} cup terjual</span>
          </div>
          <div className="stat-card">
            <p>Kas Shift Aktif</p>
            <h2>Sesuai Register</h2>
            <span className="stat-tag">Balanced</span>
          </div>
        </div>

        {/* Area Grafik & Rekap Kas */}
        <div className="shift-content">
          <div className="chart-area">
            <h3>Grafik Tren Penjualan Harian (Jam Sibuk)</h3>
            <div className="chart-placeholder">
              [Area Grafik Penjualan - Bisa diintegrasikan library Chart.js nanti]
            </div>
          </div>
          
          <div className="summary-area">
            <h3>Rekapitulasi Shift Kasir</h3>
            <ul className="summary-list">
              <li><span>Kasir Bertugas</span> <strong>Kasir 01</strong></li>
              <li><span>Modal Kas Awal</span> <strong>Rp 500.000</strong></li>
              <li><span>Tunai Masuk</span> <strong className="text-green">Rp {pendapatanTunai.toLocaleString('id-ID')}</strong></li>
              <li><span>QRIS / Non-Tunai</span> <strong className="text-blue">Rp {pendapatanQRIS.toLocaleString('id-ID')}</strong></li>
              <li className="total-kas-row" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#261a15' }}>Total Kas di Laci</span> 
                <strong style={{ fontSize: '16px', color: '#261a15' }}>
                  Rp {(pendapatanTunai + 500000).toLocaleString('id-ID')}
                </strong>
              </li>
            </ul>
            <button className="btn-close-shift" onClick={() => alert('Shift berhasil ditutup. Rekap telah dicetak!')}>
              Tutup Shift & Cetak Rekap
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}