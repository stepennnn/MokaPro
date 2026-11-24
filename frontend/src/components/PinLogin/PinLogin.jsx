import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { apiFetch } from '../../lib/api';
import PublicNavbar from '../PublicNavbar/PublicNavbar';
import './PinLogin.css';

/**
 * Reusable PinLogin component
 * Digunakan untuk halaman PIN Kasir, Barista, dan Admin
 *
 * @param {Object} props
 * @param {string} props.roleName - e.g. "Kasir"
 * @param {string} props.roleSubtitle - e.g. "Kasir · Cabang Utama Toko"
 * @param {'cashier'|'barista'|'admin'} props.roleCode
 * @param {string} props.roleIcon - image source for role icon badge
 * @param {string} props.roleIconAlt - alt text for role icon
 * @param {string} props.destination - e.g. "/cashier"
 */
export default function PinLogin({
  roleName = 'Kasir',
  roleSubtitle = 'Kasir · Cabang Utama Toko',
  roleCode,
  roleIcon,
  roleIconAlt = 'Role icon',
  destination = '/cashier'
}) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeeError, setEmployeeError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    apiFetch(`/api/login-options?role=${encodeURIComponent(roleCode)}`)
      .then((response) => response.json())
      .then((payload) => {
        if (!Array.isArray(payload.data)) {
          throw new Error('Daftar karyawan dari server tidak valid.');
        }

        if (!cancelled) {
          setEmployees(payload.data);
          setEmployeeId(payload.data.length === 1 ? String(payload.data[0].id) : '');
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setEmployeeError(requestError.message || 'Daftar karyawan tidak dapat dimuat.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingEmployees(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [roleCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      setErrorMessage('Silakan pilih akun karyawan.');
      return;
    }

    if (!/^\d{6,12}$/.test(pin)) {
      setErrorMessage('PIN harus terdiri dari 6–12 angka.');
      return;
    }

    setSubmitting(true);
    try {
      await login(employeeId, roleCode, pin);
      setErrorMessage('');
      setPin('');
      navigate(destination);
    } catch (requestError) {
      setErrorMessage(requestError.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pin-login-page">
      {/* Public Navbar Reusable Component */}
      <PublicNavbar />

      {/* Main PIN Area */}
      <main className="pin-login-main">
        <div className="pin-card">
          {/* Back Action */}
          <div className="pin-card-top">
            <button
              type="button"
              className="pin-back-btn"
              onClick={() => navigate('/select-user')}
            >
              <svg
                className="pin-back-arrow"
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
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Ganti pengguna</span>
            </button>
          </div>

          {/* Role Header */}
          <div className="pin-card-center">
            {roleIcon && (
              <div className="pin-icon-wrap">
                <img src={roleIcon} alt={roleIconAlt} className="pin-icon-img" />
              </div>
            )}
            <h1 className="pin-title">Masukkan PIN</h1>
            <p className="pin-role-name">{roleName}</p>
            <p className="pin-role-sub">{roleSubtitle}</p>
          </div>

          {/* Form PIN */}
          <form className="pin-form" onSubmit={handleSubmit}>
            <label htmlFor="employee-select" className="pin-input-label">
              Akun karyawan
            </label>
            <select
              id="employee-select"
              className="employee-select"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={loadingEmployees || employees.length === 0}
              required
            >
              <option value="">
                {loadingEmployees ? 'Memuat akun...' : 'Pilih akun karyawan'}
              </option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>

            {employeeError && (
              <span className="pin-error-text" role="alert">
                {employeeError}
              </span>
            )}
            {!loadingEmployees && !employeeError && employees.length === 0 && (
              <span className="pin-error-text" role="status">
                Belum ada akun aktif untuk peran ini.
              </span>
            )}

            <label htmlFor="pin-input" className="pin-input-label">
              PIN Karyawan
            </label>
            <input
              id="pin-input"
              type="password"
              inputMode="numeric"
              minLength={6}
              maxLength={12}
              pattern="[0-9]{6,12}"
              required
              autoFocus
              className={`pin-input ${errorMessage ? 'pin-input-error' : ''}`}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 12));
                if (errorMessage) setErrorMessage('');
              }}
              placeholder=""
              autoComplete="off"
            />

            {errorMessage && (
              <span className="pin-error-text" role="alert">
                {errorMessage}
              </span>
            )}

            <button
              type="submit"
              className="pin-submit-btn"
              disabled={submitting || loadingEmployees || employees.length === 0}
            >
              <span>{submitting ? 'Memeriksa...' : 'Masuk'}</span>
              <svg
                className="pin-submit-arrow"
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
            </button>
          </form>

          {/* Helper Note */}
          <p className="pin-helper-note">
            Gunakan PIN karyawan 6–12 angka.
          </p>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="pin-login-footer">
        <div className="pin-login-footer-container">
          <p className="pin-login-footer-copy">
            © 2026 Moka Pro POS &amp; Roastery OS. Dirancang untuk operasional kopi spesialitas.
          </p>

          <div className="pin-login-footer-status">
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
