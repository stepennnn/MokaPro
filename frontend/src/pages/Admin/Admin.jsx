import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import { apiFetch } from '../../lib/api';
import './Admin.css';

export default function Admin() {
  const [stats, setStats] = useState({
    totalPenjualan: 0,
    totalKDS: 0,
    bahanMenipis: 0,
    activeShift: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    const response = await apiFetch('/api/admin/reports');
    const payload = await response.json();
    const data = payload.data || {};

    return {
      totalPenjualan: Number(data.total_sales || 0),
      totalKDS: Number(data.active_kds_orders || 0),
      bahanMenipis: Number(data.low_stock_count || 0),
      activeShift: Boolean(data.active_shift),
    };
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setStats(await fetchStats());
    } catch (requestError) {
      setError(requestError.message || 'Gagal memuat ringkasan dashboard.');
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  useEffect(() => {
    let cancelled = false;

    fetchStats()
      .then((nextStats) => {
        if (!cancelled) {
          setStats(nextStats);
          setError('');
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || 'Gagal memuat ringkasan dashboard.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchStats]);

  return (
    <div className="admin-page">
      <DashboardNavbar />
      <main className="admin-main">
        <div className="welcome-header">
          <h1>Selamat datang, Pengelola MokaPro</h1>
          <p>Pantau operasi kafe dan pilih modul pengelolaan.</p>
        </div>

        {error && (
          <div role="alert" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '14px' }}>
            {error}{' '}
            <button type="button" onClick={loadStats} style={{ marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              Coba lagi
            </button>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <p>Penjualan</p>
            <h2>{loading ? '...' : `Rp ${(stats.totalPenjualan / 1000000).toFixed(2)} jt`}</h2>
          </div>
          <div className="stat-card">
            <p>Pesanan KDS</p>
            <h2>{loading ? '...' : stats.totalKDS}</h2>
          </div>
          <div className="stat-card">
            <p>Bahan Menipis</p>
            <h2>{loading ? '...' : stats.bahanMenipis}</h2>
          </div>
          <div className="stat-card">
            <p>Status</p>
            <h2>{loading ? '...' : (stats.activeShift ? 'Shift Aktif' : 'Terhubung')}</h2>
          </div>
        </div>

        <div className="module-grid">
          <Link to="/cashier" className="module-card">
            <div className="icon">🛒</div>
            <h3>Kasir &amp; Pembayaran</h3>
            <span>Buka modul →</span>
          </Link>
          <Link to="/kds" className="module-card">
            <div className="icon">☕</div>
            <h3>Antrean KDS</h3>
            <span>Buka modul →</span>
          </Link>
          <Link to="/admin/inventory" className="module-card">
            <div className="icon">📦</div>
            <h3>Inventaris &amp; Restock</h3>
            <span>Buka modul →</span>
          </Link>
          <Link to="/admin/reports" className="module-card">
            <div className="icon">📊</div>
            <h3>Laporan &amp; Shift</h3>
            <span>Buka modul →</span>
          </Link>
          <Link to="/history" className="module-card">
            <div className="icon">🧾</div>
            <h3>Riwayat Transaksi</h3>
            <span>Buka modul →</span>
          </Link>
          <Link to="/admin/menu" className="module-card">
            <div className="icon">⚙️</div>
            <h3>Menu &amp; Resep</h3>
            <span>Buka modul →</span>
          </Link>
          <Link to="/admin/employees" className="module-card">
            <div className="icon">👥</div>
            <h3>Karyawan &amp; PIN</h3>
            <span>Buka modul →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
