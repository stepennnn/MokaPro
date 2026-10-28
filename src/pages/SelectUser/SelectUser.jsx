import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/PublicNavbar/PublicNavbar';
import roleCashierIcon from '../../assets/role-cashier.png';
import roleBaristaIcon from '../../assets/role-barista.png';
import roleAdminIcon from '../../assets/role-admin.png';
import './SelectUser.css';

/**
 * SelectUser Page Component
 * Route: /select-user
 * Halaman pemilihan role pengguna sebelum memasuki PIN
 */
export default function SelectUser() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'cashier',
      name: 'Kasir 01',
      roleTitle: 'Kasir',
      description: 'Pemesanan, pembayaran, dan kas shift',
      icon: roleCashierIcon,
      alt: 'Role Kasir',
      path: '/cashier/pin'
    },
    {
      id: 'barista',
      name: 'Barista 01',
      roleTitle: 'Barista / Dapur',
      description: 'Antrean pesanan dan proses racik',
      icon: roleBaristaIcon,
      alt: 'Role Barista',
      path: '/barista/pin'
    },
    {
      id: 'admin',
      name: 'Pengelola 01',
      roleTitle: 'Admin / Pengelola',
      description: 'Inventaris, laporan, dan pengelolaan sistem',
      icon: roleAdminIcon,
      alt: 'Role Admin / Pengelola',
      path: '/admin/pin'
    }
  ];

  return (
    <div className="select-user-page">
      {/* Public Navbar Reusable Component */}
      <PublicNavbar />

      {/* Main Selection Area */}
      <main className="select-user-main">
        <div className="select-user-container">
          {/* Back Navigation Button */}
          <div className="select-user-top-actions">
            <button
              type="button"
              className="select-user-back-btn"
              onClick={() => navigate('/')}
            >
              <svg
                className="back-arrow-icon"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Kembali</span>
            </button>
          </div>

          {/* Section Heading */}
          <section className="select-user-header">
            <span className="select-user-eyebrow">AKSES OPERASIONAL</span>
            <h1 className="select-user-title">Pilih akun karyawan</h1>
            <p className="select-user-subtitle">
              Pilih akun sesuai pekerjaanmu, lalu masukkan PIN untuk masuk.
            </p>
          </section>

          {/* Role Cards Grid */}
          <section className="select-user-grid" aria-label="Daftar akun karyawan">
            {roles.map((role) => (
              <div
                key={role.id}
                className="role-card"
                onClick={() => navigate(role.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(role.path);
                  }
                }}
              >
                {/* Role Icon Badge */}
                <div className="role-card-icon-wrap">
                  <img
                    src={role.icon}
                    alt={role.alt}
                    className="role-card-icon"
                  />
                </div>

                {/* Role Info */}
                <div className="role-card-content">
                  <h2 className="role-card-name">{role.name}</h2>
                  <p className="role-card-role-title">{role.roleTitle}</p>
                  <p className="role-card-desc">{role.description}</p>
                </div>

                {/* Action Link */}
                <div className="role-card-action">
                  <span>Lanjut ke PIN</span>
                  <svg
                    className="role-action-arrow"
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="select-user-footer">
        <div className="select-user-footer-container">
          <p className="select-user-footer-copy">
            © 2026 Moka Pro POS &amp; Roastery OS. Dirancang untuk operasional kopi spesialitas.
          </p>

          <div className="select-user-footer-status">
            <div className="status-indicator">
              <span className="status-dot" aria-hidden="true"></span>
              <span className="status-text">Cloud Tersinkronisasi</span>
            </div>
            <span className="status-separator" aria-hidden="true">•</span>
            <span className="terminal-id">Terminal #01</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
