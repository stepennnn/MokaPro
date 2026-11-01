import { useState } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import './TransactionHistory.css';

/**
 * TransactionHistory Page
 * Route: /history
 * Halaman riwayat transaksi untuk role Kasir.
 * Menampilkan log pembayaran yang telah dikonfirmasi beserta statistik ringkasan.
 */
export default function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState('');

  // Data dummy transaksi — dalam prototype ini dimulai dari kosong
  // sesuai screenshot riwayat.png yang menunjukkan 0 transaksi
  const DUMMY_TRANSACTIONS = [];

  const filteredTransactions = DUMMY_TRANSACTIONS.filter((trx) => {
    const q = searchQuery.toLowerCase();
    return (
      trx.id.toLowerCase().includes(q) ||
      trx.items.some((item) => item.toLowerCase().includes(q))
    );
  });

  const totalNominal = filteredTransactions.reduce(
    (sum, trx) => sum + trx.total,
    0
  );

  const formatRupiah = (val) =>
    `Rp ${Number(val).toLocaleString('id-ID')}`;

  return (
    <div className="history-page">
      {/* Dashboard Navbar — Role Kasir */}
      <DashboardNavbar
        role="cashier"
        storeName="Cabang Utama Toko"
        userName="Kasir 01"
        userRoleLabel="Kasir"
      />

      {/* Main Content */}
      <main className="history-main">
        <div className="history-container">
          {/* Page Header */}
          <header className="history-header">
            <h1 className="history-title">Riwayat Transaksi</h1>
            <p className="history-subtitle">
              Daftar pembayaran yang berhasil dikonfirmasi dalam prototype MokaPro.
            </p>
          </header>

          {/* Stat Cards Row */}
          <section className="history-stats-row" aria-label="Statistik Transaksi">
            <div className="history-stat-card">
              <span className="history-stat-label">Jumlah transaksi tersimpan</span>
              <span className="history-stat-value">{filteredTransactions.length}</span>
            </div>

            <div className="history-stat-card">
              <span className="history-stat-label">Total nominal tersimpan</span>
              <span className="history-stat-value">{formatRupiah(totalNominal)}</span>
            </div>
          </section>

          {/* Log Pembayaran Card */}
          <section className="history-log-card" aria-labelledby="history-log-title">
            <div className="history-log-header">
              <h2 id="history-log-title" className="history-log-title">
                Log Pembayaran
              </h2>
              <input
                className="history-search-input"
                type="text"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cari transaksi berdasarkan ID atau nama produk"
              />
            </div>

            {/* Conditional: Tabel data atau empty state */}
            {filteredTransactions.length > 0 ? (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>ID Transaksi</th>
                      <th>Tanggal</th>
                      <th>Waktu</th>
                      <th>Kasir</th>
                      <th>Item</th>
                      <th>Metode</th>
                      <th className="history-th-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((trx) => (
                      <tr key={trx.id}>
                        <td className="history-td-id">{trx.id}</td>
                        <td>{trx.date}</td>
                        <td>{trx.time}</td>
                        <td>{trx.cashier}</td>
                        <td>{trx.items.join(', ')}</td>
                        <td>
                          <span className={`history-badge history-badge--${trx.method.toLowerCase()}`}>
                            {trx.method}
                          </span>
                        </td>
                        <td className="history-td-right">{formatRupiah(trx.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="history-empty-state">
                <p className="history-empty-text">
                  Belum ada transaksi yang cocok. Buat pembayaran di Kasir untuk menambahkan riwayat.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="history-footer">
        <div className="history-footer-container">
          <p className="history-footer-copy">
            &copy; 2026 Moka Pro POS &amp; Roastery OS. Dirancang untuk operasional kopi spesialitas.
          </p>
          <div className="history-footer-status">
            <div className="status-indicator">
              <span className="status-dot" aria-hidden="true"></span>
              <span className="status-text">Cloud Tersinkronisasi</span>
            </div>
            <span className="status-separator" aria-hidden="true">&bull;</span>
            <span className="terminal-id">Terminal #01</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
