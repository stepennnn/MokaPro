import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import { apiFetch } from '../../lib/api';
import './Shift.css';

export default function Shift() {
  const { user } = useAuth();
  const [shift, setShift] = useState(null);
  const [fallbackSummary, setFallbackSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [openingFloat, setOpeningFloat] = useState('500000');
  const [submitting, setSubmitting] = useState(false);

  const fetchShiftData = useCallback(async () => {
    const response = await apiFetch('/api/shifts/current');
    const payload = await response.json();
    return {
      shift: payload.data || null,
      fallbackSummary: payload.summary || null,
    };
  }, []);

  const loadShift = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await fetchShiftData();
      setShift(result.shift);
      setFallbackSummary(result.fallbackSummary);
    } catch (requestError) {
      setError(requestError.message || 'Gagal memuat data shift kasir.');
    } finally {
      setLoading(false);
    }
  }, [fetchShiftData]);

  useEffect(() => {
    let cancelled = false;

    fetchShiftData()
      .then((result) => {
        if (!cancelled) {
          setShift(result.shift);
          setFallbackSummary(result.fallbackSummary);
          setError('');
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || 'Gagal memuat data shift kasir.');
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
  }, [fetchShiftData]);

  const handleOpenShift = async (e) => {
    e.preventDefault();
    const numericFloat = Number(openingFloat);
    if (!Number.isFinite(numericFloat) || numericFloat < 0) {
      setError('Modal kas awal harus berupa angka valid (>= 0).');
      return;
    }

    setSubmitting(true);
    setError('');
    setFeedback('');

    try {
      const response = await apiFetch('/api/shifts/open', {
        method: 'POST',
        body: JSON.stringify({
          opening_float: numericFloat.toFixed(2),
        }),
      });
      const payload = await response.json();
      setShift(payload.data || null);
      setFeedback('Shift kasir berhasil dibuka.');
    } catch (requestError) {
      setError(requestError.message || 'Gagal membuka shift kasir.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    setSubmitting(true);
    setError('');
    setFeedback('');

    try {
      await apiFetch('/api/shifts/close', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      await loadShift();
      setFeedback('Shift berhasil ditutup dan direkap di database.');
    } catch (requestError) {
      setError(requestError.message || 'Gagal menutup shift kasir.');
    } finally {
      setSubmitting(false);
    }
  };

  const summary = shift?.summary || fallbackSummary || {
    total_sales: '0.00',
    total_orders: 0,
    cash_sales: '0.00',
    qris_sales: '0.00',
    expected_cash: '0.00',
    top_product: { name: '-', quantity: 0 },
  };

  const modalKasAwal = Number(shift?.opening_float || 0);
  const totalPenjualan = Number(summary.total_sales || 0);
  const totalTransaksi = Number(summary.total_orders || 0);
  const pendapatanTunai = Number(summary.cash_sales || 0);
  const pendapatanQRIS = Number(summary.qris_sales || 0);
  const expectedCash = Number(summary.expected_cash || modalKasAwal + pendapatanTunai);
  const produkTerlaris = summary.top_product || { name: '-', quantity: 0 };
  const cashierDisplayName = shift?.cashier_name || user?.name || '-';

  return (
    <div className="shift-page">
      <DashboardNavbar />
      <main className="shift-main">
        <h1 className="page-title">Rekapitulasi Shift Kasir</h1>

        {error && (
          <div role="alert" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {feedback && (
          <div role="status" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#eef8f0', color: '#1f6e3d', fontSize: '14px' }}>
            {feedback}
          </div>
        )}

        {loading ? (
          <p role="status" style={{ padding: '24px', color: '#7a6d64' }}>Memuat data shift...</p>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <p>Penjualan Shift / Hari Ini</p>
                <h2>Rp {totalPenjualan.toLocaleString('id-ID')}</h2>
                <span className="stat-tag">Total keseluruhan</span>
              </div>
              <div className="stat-card">
                <p>Total Transaksi</p>
                <h2>{totalTransaksi} Pesanan</h2>
                <span className="stat-tag">Transaksi berhasil</span>
              </div>
              <div className="stat-card">
                <p>Produk Terlaris</p>
                <h2>{produkTerlaris.name}</h2>
                <span className="stat-tag">{produkTerlaris.quantity} terjual</span>
              </div>
              <div className="stat-card">
                <p>Status Shift</p>
                <h2>{shift ? 'Shift Aktif' : 'Belum Dibuka'}</h2>
                <span className="stat-tag">{shift ? 'Balanced' : 'Buka shift untuk mencatat kas'}</span>
              </div>
            </div>

            <div className="shift-content">
              <div className="chart-area">
                <h3>Status Operasional Shift</h3>
                {shift ? (
                  <div className="chart-placeholder" style={{ flexDirection: 'column', gap: '8px', padding: '24px' }}>
                    <strong>Shift #{shift.id} Aktif</strong>
                    <span>Dibuka pada: {shift.opened_at ? new Date(shift.opened_at).toLocaleString('id-ID') : '-'}</span>
                    <span>Kasir: {cashierDisplayName}</span>
                  </div>
                ) : (
                  <form onSubmit={handleOpenShift} style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '340px' }}>
                    <label htmlFor="opening-float-input" style={{ fontSize: '14px', fontWeight: 500 }}>
                      Modal Kas Awal (Rp)
                    </label>
                    <input
                      id="opening-float-input"
                      type="number"
                      min="0"
                      step="1"
                      value={openingFloat}
                      onChange={(e) => setOpeningFloat(e.target.value)}
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d6ccc2' }}
                      required
                    />
                    <button type="submit" className="btn-close-shift" disabled={submitting}>
                      {submitting ? 'Membuka Shift...' : 'Buka Shift Kasir'}
                    </button>
                  </form>
                )}
              </div>

              <div className="summary-area">
                <h3>Rekapitulasi Shift Kasir</h3>
                <ul className="summary-list">
                  <li><span>Kasir Bertugas</span> <strong>{cashierDisplayName}</strong></li>
                  <li><span>Modal Kas Awal</span> <strong>Rp {modalKasAwal.toLocaleString('id-ID')}</strong></li>
                  <li><span>Tunai Masuk</span> <strong className="text-green">Rp {pendapatanTunai.toLocaleString('id-ID')}</strong></li>
                  <li><span>QRIS / Non-Tunai</span> <strong className="text-blue">Rp {pendapatanQRIS.toLocaleString('id-ID')}</strong></li>
                  <li className="total-kas-row" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#261a15' }}>Total Kas di Laci</span>
                    <strong style={{ fontSize: '16px', color: '#261a15' }}>
                      Rp {expectedCash.toLocaleString('id-ID')}
                    </strong>
                  </li>
                </ul>
                <button
                  type="button"
                  className="btn-close-shift"
                  disabled={!shift || submitting}
                  onClick={handleCloseShift}
                >
                  {submitting ? 'Memproses...' : 'Tutup Shift & Cetak Rekap'}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
