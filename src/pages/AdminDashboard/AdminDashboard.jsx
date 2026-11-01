import { Link } from 'react-router-dom';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import modulePosIcon from '../../assets/module-pos.png';
import moduleKdsIcon from '../../assets/module-kds.png';
import moduleInventoryIcon from '../../assets/module-inventory.png';
import moduleReportsIcon from '../../assets/module-reports.png';
import moduleHistoryIcon from '../../assets/module-history.png';
import moduleMenuIcon from '../../assets/module-menu.png';
import './AdminDashboard.css';

// Data ringkasan performa kafe sesuai referensi visual admin.png
const STATS_DATA = [
  { id: 'sales', label: 'Penjualan', value: 'Rp 3,85 jt' },
  { id: 'kds', label: 'Pesanan KDS', value: '3' },
  { id: 'low-stock', label: 'Bahan Menipis', value: '2' },
  { id: 'status', label: 'Status', value: 'Demo Aktif' }
];

// Data modul operasional kafe sesuai referensi visual admin.png
const MODULES_DATA = [
  {
    id: 'pos',
    title: 'Kasir & Pembayaran',
    path: '/cashier',
    icon: modulePosIcon,
    iconAlt: 'Kasir & Pembayaran'
  },
  {
    id: 'kds',
    title: 'Antrean KDS',
    path: '/kds',
    icon: moduleKdsIcon,
    iconAlt: 'Antrean KDS'
  },
  {
    id: 'inventory',
    title: 'Inventaris & Restock',
    path: '/admin/inventory',
    icon: moduleInventoryIcon,
    iconAlt: 'Inventaris & Restock'
  },
  {
    id: 'reports',
    title: 'Laporan & Shift',
    path: '/admin/reports',
    icon: moduleReportsIcon,
    iconAlt: 'Laporan & Shift'
  },
  {
    id: 'history',
    title: 'Riwayat Transaksi',
    path: '/history',
    icon: moduleHistoryIcon,
    iconAlt: 'Riwayat Transaksi'
  },
  {
    id: 'menu',
    title: 'Menu & Resep',
    path: '/admin/menu',
    icon: moduleMenuIcon,
    iconAlt: 'Menu & Resep'
  }
];

/**
 * AdminDashboard Page Component
 * Route: /admin
 * Halaman utama role Admin / Pengelola untuk monitoring dan navigasi modul
 */
export default function AdminDashboard() {
  return (
    <div className="admin-dashboard-page">
      {/* Dashboard Navbar Role Admin / Pengelola */}
      <DashboardNavbar
        role="admin"
        storeName="Cabang Utama Toko"
        userName="Pengelola 01"
        userRoleLabel="Admin / Pengelola"
      />

      {/* Main Content Area */}
      <main className="admin-dashboard-main">
        <div className="admin-dashboard-container">
          {/* Header Title Section */}
          <header className="admin-dashboard-header">
            <h1 className="admin-dashboard-title">
              Selamat datang, Pengelola MokaPro
            </h1>
            <p className="admin-dashboard-subtitle">
              Pantau operasi kafe dan pilih modul pengelolaan.
            </p>
          </header>

          {/* Quick Stats Summary Row */}
          <section className="admin-stats-section" aria-label="Ringkasan Statistik Kafe">
            <div className="admin-stats-grid">
              {STATS_DATA.map((stat) => (
                <div key={stat.id} className="admin-stat-card">
                  <span className="admin-stat-label">{stat.label}</span>
                  <span className="admin-stat-value">{stat.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Operational Modules Navigation Grid */}
          <section className="admin-modules-section" aria-label="Modul Pengelolaan Operasional">
            <div className="admin-modules-grid">
              {MODULES_DATA.map((mod) => (
                <Link
                  key={mod.id}
                  to={mod.path}
                  className="admin-module-card"
                >
                  <div className="admin-module-icon-wrap">
                    <img
                      src={mod.icon}
                      alt={mod.iconAlt}
                      className="admin-module-icon"
                      width="38"
                      height="38"
                    />
                  </div>
                  <h2 className="admin-module-title">{mod.title}</h2>
                  <div className="admin-module-action">
                    <span>Buka modul</span>
                    <span className="action-arrow" aria-hidden="true">&rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="admin-dashboard-footer">
        <div className="admin-dashboard-footer-container">
          <p className="admin-dashboard-footer-copy">
            &copy; 2026 Moka Pro POS &amp; Roastery OS. Dirancang untuk operasional kopi spesialitas.
          </p>

          <div className="admin-dashboard-footer-status">
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
