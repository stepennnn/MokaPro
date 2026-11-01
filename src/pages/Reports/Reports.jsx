import { useState } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import './Reports.css';

// Master data statistik ringkasan sesuai referensi visual laporan.png
const STATS_DATA = [
  {
    id: 'sales-today',
    label: 'Penjualan Hari Ini',
    value: 'Rp 3.850.000',
    trend: '↑ 14% vs kemarin',
    isPositive: true
  },
  {
    id: 'total-trx',
    label: 'Total Transaksi',
    value: '142 Pesanan',
    subtitle: 'Data demo'
  },
  {
    id: 'top-product',
    label: 'Produk Terlaris',
    value: 'Kopi Gula Aren',
    subtitle: '58 cup'
  },
  {
    id: 'shift-status',
    label: 'Kas Shift Aktif',
    value: 'Sesuai Register',
    subtitle: 'Balanced'
  }
];



// Data rekapitulasi shift kasir
const SHIFT_SUMMARY = {
  cashierName: 'Kasir 01',
  initialCash: 500000,
  cashIn: 1450000,
  nonCashIn: 2400000
};

/**
 * Reports Page Component
 * Route: /admin/reports
 * Halaman pelaporan performa penjualan dan rekapitulasi shift operasional kafe
 */
export default function Reports() {
  const [shiftClosed, setShiftClosed] = useState(false);

  const formatRupiah = (val) =>
    `Rp ${Number(val).toLocaleString('id-ID')}`;

  const handleCloseShift = () => {
    setShiftClosed(true);
    window.print();
  };

  return (
    <div className="reports-page">
      {/* Dashboard Navbar Role Admin / Pengelola */}
      <DashboardNavbar
        role="admin"
        storeName="Cabang Utama Toko"
        userName="Pengelola 01"
        userRoleLabel="Admin / Pengelola"
      />

      {/* Main Content Area */}
      <main className="reports-main">
        <div className="reports-container">
          {/* Top Stat Cards Row (4 Columns) */}
          <section className="reports-stats-section" aria-label="Statistik Penjualan Hari Ini">
            <div className="reports-stats-grid">
              {STATS_DATA.map((stat) => (
                <div key={stat.id} className="reports-stat-card">
                  <span className="reports-stat-label">{stat.label}</span>
                  <span className="reports-stat-value">{stat.value}</span>
                  {stat.trend && (
                    <span className="reports-stat-trend reports-stat-trend--up">
                      {stat.trend}
                    </span>
                  )}
                  {stat.subtitle && (
                    <span className="reports-stat-subtitle">
                      {stat.subtitle}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Two-Column Grid: Left (Hourly Sales Trend) & Right (Shift Recap) */}
          <div className="reports-grid">
            {/* Left Column: Hourly Sales Trend Chart Card */}
            <section
              className="reports-card reports-card--chart"
              aria-labelledby="reports-chart-title"
            >
              <h1 id="reports-chart-title" className="reports-card-title">
                Grafik Tren Penjualan Harian (Jam Sibuk)
              </h1>

              {/* Chart Placeholder — area putih kosong sesuai referensi */}
              <div className="reports-chart-wrap" aria-label="Area Grafik Penjualan" />
            </section>

            {/* Right Column: Shift Recap Card */}
            <section
              className="reports-card reports-card--shift"
              aria-labelledby="reports-shift-title"
            >
              <h2 id="reports-shift-title" className="reports-card-title">
                Rekapitulasi Shift Kasir
              </h2>

              <div className="reports-shift-list">
                <div className="reports-shift-row">
                  <span className="reports-shift-label">Kasir Bertugas</span>
                  <span className="reports-shift-val">{SHIFT_SUMMARY.cashierName}</span>
                </div>

                <div className="reports-shift-row">
                  <span className="reports-shift-label">Modal Kas Awal</span>
                  <span className="reports-shift-val">
                    {formatRupiah(SHIFT_SUMMARY.initialCash)}
                  </span>
                </div>

                <div className="reports-shift-row">
                  <span className="reports-shift-label">Tunai Masuk</span>
                  <span className="reports-shift-val">
                    {formatRupiah(SHIFT_SUMMARY.cashIn)}
                  </span>
                </div>

                <div className="reports-shift-row">
                  <span className="reports-shift-label">QRIS / Non-Tunai</span>
                  <span className="reports-shift-val">
                    {formatRupiah(SHIFT_SUMMARY.nonCashIn)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="reports-shift-btn"
                onClick={handleCloseShift}
              >
                {shiftClosed ? '✓ Shift Ditutup & Tercetak' : 'Tutup Shift & Cetak Rekap'}
              </button>
            </section>
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="reports-footer">
        <div className="reports-footer-container">
          <p className="reports-footer-copy">
            &copy; 2026 Moka Pro POS &amp; Roastery OS. Dirancang untuk operasional kopi spesialitas.
          </p>

          <div className="reports-footer-status">
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
