import { useState } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import './ShiftReport.css';

/**
 * ShiftReport Page — Rekap Shift Kasir
 * Route: /cashier/shift
 * Role: Kasir
 *
 * Menampilkan ringkasan performa penjualan shift kasir aktif:
 * - 4 stat cards (penjualan, total transaksi, produk terlaris, kas shift)
 * - Grafik tren penjualan harian (jam sibuk) — visualisasi CSS bar chart
 * - Panel rekapitulasi shift dengan total kas & tombol tutup shift
 */

// Dummy data statistik ringkasan shift kasir
const SHIFT_STATS = [
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



// Data dummy rekapitulasi shift kasir
const SHIFT_SUMMARY = {
  cashierName: 'Kasir 01',
  initialCash: 500000,
  cashIn: 1450000,
  nonCashIn: 2400000
};

export default function ShiftReport() {
  const [shiftClosed, setShiftClosed] = useState(false);

  const formatRupiah = (val) =>
    `Rp ${Number(val).toLocaleString('id-ID')}`;

  const handleCloseShift = () => {
    setShiftClosed(true);
    window.print();
  };

  return (
    <div className="shiftreport-page">
      {/* DashboardNavbar — Role Kasir, tab "Shift Kasir" aktif di /cashier/shift */}
      <DashboardNavbar
        role="cashier"
        storeName="Cabang Utama Toko"
        userName="Kasir 01"
        userRoleLabel="Kasir"
      />

      {/* Main Content */}
      <main className="shiftreport-main">
        <div className="shiftreport-container">

          {/* 4 Stat Cards Row */}
          <section className="shiftreport-stats-grid" aria-label="Statistik Shift Kasir">
            {SHIFT_STATS.map((stat) => (
              <div key={stat.id} className="shiftreport-stat-card">
                <span className="shiftreport-stat-label">{stat.label}</span>
                <span className="shiftreport-stat-value">{stat.value}</span>
                {stat.trend && (
                  <span className="shiftreport-stat-trend shiftreport-stat-trend--up">
                    {stat.trend}
                  </span>
                )}
                {stat.subtitle && (
                  <span className="shiftreport-stat-subtitle">{stat.subtitle}</span>
                )}
              </div>
            ))}
          </section>

          {/* Two-Column Grid */}
          <div className="shiftreport-grid">

            {/* Left: Hourly Sales Bar Chart Card */}
            <section
              className="shiftreport-card shiftreport-card--chart"
              aria-labelledby="shiftreport-chart-title"
            >
              <h2 id="shiftreport-chart-title" className="shiftreport-card-title">
                Grafik Tren Penjualan Harian (Jam Sibuk)
              </h2>

              {/* Chart Placeholder — area putih kosong sesuai referensi */}
              <div className="shiftreport-chart-wrap" aria-label="Area Grafik Penjualan" />
            </section>

            {/* Right: Shift Recap Card */}
            <section
              className="shiftreport-card shiftreport-card--recap"
              aria-labelledby="shiftreport-recap-title"
            >
              <h2 id="shiftreport-recap-title" className="shiftreport-card-title">
                Rekapitulasi Shift Kasir
              </h2>

              <div className="shiftreport-recap-list">
                <div className="shiftreport-recap-row">
                  <span className="shiftreport-recap-label">Kasir Bertugas</span>
                  <span className="shiftreport-recap-val">{SHIFT_SUMMARY.cashierName}</span>
                </div>

                <div className="shiftreport-recap-row">
                  <span className="shiftreport-recap-label">Modal Kas Awal</span>
                  <span className="shiftreport-recap-val">
                    {formatRupiah(SHIFT_SUMMARY.initialCash)}
                  </span>
                </div>

                <div className="shiftreport-recap-row">
                  <span className="shiftreport-recap-label">Tunai Masuk</span>
                  <span className="shiftreport-recap-val">
                    {formatRupiah(SHIFT_SUMMARY.cashIn)}
                  </span>
                </div>

                <div className="shiftreport-recap-row">
                  <span className="shiftreport-recap-label">QRIS / Non-Tunai</span>
                  <span className="shiftreport-recap-val">
                    {formatRupiah(SHIFT_SUMMARY.nonCashIn)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="shiftreport-close-btn"
                onClick={handleCloseShift}
                disabled={shiftClosed}
              >
                {shiftClosed ? '✓ Shift Ditutup & Tercetak' : 'Tutup Shift & Cetak Rekap'}
              </button>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shiftreport-footer">
        <div className="shiftreport-footer-container">
          <p className="shiftreport-footer-copy">
            &copy; 2026 Moka Pro POS &amp; Roastery OS. Dirancang untuk operasional kopi spesialitas.
          </p>
          <div className="shiftreport-footer-status">
            <div className="sr-status-indicator">
              <span className="sr-status-dot" aria-hidden="true"></span>
              <span className="sr-status-text">Cloud Tersinkronisasi</span>
            </div>
            <span className="sr-status-sep" aria-hidden="true">&bull;</span>
            <span className="sr-terminal-id">Terminal #01</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
