import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/PublicNavbar/PublicNavbar';
import heroCoffeeImg from '../../assets/welcome-hero.png';
import './Welcome.css';

/**
 * Welcome Page Component
 * Route: /
 * Halaman pembuka aplikasi POS & Roastery OS MokaPro
 */
export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-page">
      {/* Public Navbar Reusable Component */}
      <PublicNavbar />

      {/* Main Content Area */}
      <main className="welcome-main">
        <div className="welcome-container">
          <div className="welcome-hero-grid">
            {/* Left Column: Heading, description, CTA, feature badges */}
            <section className="welcome-left-col">
              <p className="welcome-eyebrow">Mokapro • Pos &amp; Roastery OS</p>

              <h1 className="welcome-heading">
                Selamat datang<br />
                di <span className="welcome-brand-highlight">MokaPro.</span>
              </h1>

              <p className="welcome-description">
                Transaksi, antrean dapur, stok, dan laporan operasional kafe terhubung dalam satu tempat.
              </p>

              <button
                type="button"
                className="welcome-cta-btn"
                onClick={() => navigate('/select-user')}
              >
                <span>Mulai Operasional</span>
                <svg
                  className="welcome-cta-arrow"
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
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <div className="welcome-badges-row">
                <div className="welcome-badge">
                  <svg
                    className="badge-check-icon"
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>POS Terintegrasi</span>
                </div>

                <div className="welcome-badge">
                  <svg
                    className="badge-check-icon"
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Kitchen Display</span>
                </div>

                <div className="welcome-badge">
                  <svg
                    className="badge-check-icon"
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Monitoring Inventaris</span>
                </div>
              </div>
            </section>

            {/* Right Column: Framed Preview Card */}
            <aside className="welcome-right-col" aria-label="Ringkasan platform MokaPro">
              <div className="welcome-card-outer">
                <div className="welcome-card-inner">
                  {/* Card top brown strip */}
                  <div className="card-header-bar">
                    <div className="card-header-brand">
                      <div className="card-header-icon-box" aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          width="12"
                          height="12"
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
                      <span className="card-header-title">MokaPro</span>
                    </div>
                    <span className="card-header-tagline">POS &amp; Roastery OS</span>
                  </div>

                  {/* Card inner body content */}
                  <div className="card-body">
                    <span className="card-eyebrow">BANGUN PENGALAMAN KAFE TERBAIK</span>
                    <h2 className="card-title">Lebih mudah melayani, lebih nyaman bekerja.</h2>
                    <p className="card-subtitle">
                      Pesanan, racikan barista, inventaris, dan laporan terhubung dalam MokaPro.
                    </p>

                    <div className="card-image-wrap">
                      <img
                        src={heroCoffeeImg}
                        alt="Pesanan kopi dan operasional barista kafe MokaPro"
                        className="card-image"
                      />
                    </div>

                    <p className="card-footer-note">
                      Satu tempat untuk melayani pelanggan dan mengelola kafe
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="welcome-footer">
        <div className="welcome-footer-container">
          <p className="welcome-footer-copy">
            © 2026 Moka Pro POS &amp; Roastery OS. Dirancang untuk operasional kopi spesialitas.
          </p>

          <div className="welcome-footer-status">
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
