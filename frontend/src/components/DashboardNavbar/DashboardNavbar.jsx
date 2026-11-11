import { Link, useLocation, useNavigate } from 'react-router-dom';
import './DashboardNavbar.css';

/**
 * DashboardNavbar component
 * Navbar untuk halaman internal setelah autentikasi (Kasir, Barista, Admin)
 *
 * @param {Object} props
 * @param {'cashier'|'barista'|'admin'} [props.role='cashier']
 * @param {string} [props.storeName='Cabang Utama Toko']
 * @param {string} [props.userName='Kasir 01']
 * @param {string} [props.userRoleLabel='Kasir']
 */
export default function DashboardNavbar({
  role = 'cashier',
  storeName = 'Cabang Utama Toko',
  userName = 'Kasir 01',
  userRoleLabel = 'Kasir'
}) {
  const location = useLocation();
  const navigate = useNavigate();

  // Konfigurasi tabs berdasarkan role
  const getNavTabs = () => {
    if (role === 'cashier') {
      return [
        { label: 'Kasir', path: '/cashier' },
        { label: 'Riwayat Transaksi', path: '/history' },
        { label: 'Shift Kasir', path: '/cashier/shift' }
      ];
    }
    if (role === 'barista') {
      return [
        { label: 'Kitchen Display', path: '/kds' }
      ];
    }
    return [
      { label: 'Dashboard', path: '/admin' },
      { label: 'Inventaris', path: '/admin/inventory' },
      { label: 'Menu', path: '/admin/menu' },
      { label: 'Laporan', path: '/admin/reports' },
      { label: 'Riwayat', path: '/history' }
    ];
  };

  const tabs = getNavTabs();

  return (
    <header className="dashboard-navbar">
      <div className="dashboard-navbar-container">
        {/* Left Section: Brand Logo & Branch */}
        <div className="dashboard-navbar-left">
          <Link to="/" className="dashboard-navbar-brand">
            <div className="dashboard-logo-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="#DEBA8F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 2.5v2" />
                <path d="M11 1.5v3" />
                <path d="M15 2.5v2" />
                <path d="M4 7.5h11v5.5a3.5 3.5 0 0 1-3.5 3.5h-4A3.5 3.5 0 0 1 4 13V7.5z" />
                <path d="M15 9.5h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2" />
                <path d="M3 20.5h14" />
              </svg>
            </div>
            <div className="dashboard-title">
              <span className="brand-moka">Moka</span>
              <span className="brand-pro">Pro</span>
            </div>
          </Link>

          <div className="dashboard-branch-pill">
            <svg
              className="pill-icon"
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
              <polyline points="9 21 9 12 15 12 15 21" />
            </svg>
            <span>{storeName}</span>
          </div>
        </div>

        {/* Center Section: Navigation Tabs Segmented Pill */}
        <nav className="dashboard-navbar-center" aria-label="Menu navigasi operasional">
          <div className="dashboard-nav-pill-group">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`dashboard-nav-tab ${isActive ? 'active' : ''}`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right Section: User Info Card & Ganti Pengguna */}
        <div className="dashboard-navbar-right">
          <div className="dashboard-user-badge">
            <span className="dashboard-user-name">{userName}</span>
            <span className="dashboard-user-role">{userRoleLabel}</span>
          </div>

          <button
            type="button"
            className="dashboard-switch-user-btn"
            onClick={() => navigate('/select-user')}
          >
            <span>Ganti Pengguna</span>
            <svg
              className="switch-user-icon"
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
