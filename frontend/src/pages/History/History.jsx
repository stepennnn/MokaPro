import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import './History.css';

export default function History() {
  const [history, setHistory] = useState([]);

  // Ambil data saat halaman dimuat
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('mokapro_history')) || [];
    setHistory(savedHistory);
  }, []);

  // Hitung total pendapatan
  const totalPendapatan = history.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="history-page">
      <DashboardNavbar role="cashier" />
      <main className="history-main">
        <div className="header-section">
          <h1 className="page-title">Riwayat Transaksi</h1>
          <p className="page-subtitle">Daftar pembayaran yang berhasil dikonfirmasi.</p>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <span className="card-label">Jumlah transaksi tersimpan</span>
            <span className="card-value">{history.length}</span>
          </div>
          <div className="summary-card">
            <span className="card-label">Total nominal tersimpan</span>
            <span className="card-value">Rp {totalPendapatan.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="log-section">
          <div className="log-header">
            <h3>Log Pembayaran</h3>
          </div>
          
          {history.length === 0 ? (
            <div className="empty-log">
              <p>Belum ada transaksi. Silakan buat pesanan di halaman Kasir.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Transaksi</th>
                  <th>Waktu</th>
                  <th>Tipe</th>
                  <th>Metode</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {history.map((trx) => (
                  <tr key={trx.id}>
                    <td><strong>{trx.id}</strong></td>
                    <td>{trx.date}</td>
                    <td>{trx.type}</td>
                    <td>{trx.method}</td>
                    <td>Rp {trx.total.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}