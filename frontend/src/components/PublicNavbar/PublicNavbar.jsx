import './PublicNavbar.css';

/**
 * PublicNavbar component
 * Digunakan pada Welcome page dan alur authentication / public flow
 *
 * @param {Object} props
 * @param {string} [props.storeName='Cabang Utama Toko']
 * @param {string} [props.tagline='POS & Roastery OS']
 */
export default function PublicNavbar({
  storeName = 'Cabang Utama Toko',
  tagline = 'POS & Roastery OS'
}) {
  return (
    <header className="public-navbar">
      <div className="public-navbar-container">
        {/* Left Section: Brand Logo & Store Pill */}
        <div className="public-navbar-left">
          <div className="public-navbar-brand">
            <div className="public-navbar-logo-icon" aria-label="MokaPro logo icon">
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
                {/* Steam lines */}
                <path d="M7 2.5v2" />
                <path d="M11 1.5v3" />
                <path d="M15 2.5v2" />
                {/* Cup body and handle */}
                <path d="M4 7.5h11v5.5a3.5 3.5 0 0 1-3.5 3.5h-4A3.5 3.5 0 0 1 4 13V7.5z" />
                <path d="M15 9.5h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2" />
                {/* Saucer */}
                <path d="M3 20.5h14" />
              </svg>
            </div>
            <div className="public-navbar-title">
              <span className="brand-moka">Moka</span>
              <span className="brand-pro">Pro</span>
            </div>
          </div>

          {/* Store Branch Pill */}
          <div className="public-navbar-pill public-navbar-branch">
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
            <span className="pill-text">{storeName}</span>
          </div>
        </div>

        {/* Right Section: Tagline / OS Pill */}
        <div className="public-navbar-right">
          <div className="public-navbar-pill public-navbar-tagline">
            <span className="pill-text">{tagline}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
