import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import { apiFetch } from '../../lib/api';
import './Reports.css';

export default function Reports() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReportData = useCallback(async () => {
    const response = await apiFetch('/api/admin/reports');
    const payload = await response.json();
    return payload.data || null;
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setReport(await fetchReportData());
    } catch (requestError) {
      setError(requestError.message || 'Gagal memuat laporan penjualan.');
    } finally {
      setLoading(false);
    }
  }, [fetchReportData]);

  useEffect(() => {
    let cancelled = false;

    fetchReportData()
      .then((data) => {
        if (!cancelled) {
          setReport(data);
          setError('');
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || 'Gagal memuat laporan penjualan.');
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
  }, [fetchReportData]);

  const todaySales = Number(report?.today_sales || 0);
  const totalOrders = Number(report?.total_orders || 0);
  const cashSales = Number(report?.active_shift?.cash_sales ?? report?.cash_sales ?? 0);
  const qrisSales = Number(report?.active_shift?.qris_sales ?? report?.qris_sales ?? 0);
  const openingFloat = Number(report?.active_shift?.opening_float || 0);
  const topProductName = report?.top_product?.name || '-';
  const activeCashierName = report?.active_shift?.cashier_name || user?.name || '-';
  const hourlySales = Array.isArray(report?.hourly_sales) ? report.hourly_sales : [];

  return (
    <div className="reports-page">
      <DashboardNavbar />
      <main className="reports-main">
        <h1 className="page-title">Laporan Penjualan &amp; Shift</h1>

        {error && (
          <div role="alert" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '14px' }}>
            {error}{' '}
            <button type="button" onClick={loadReports} style={{ marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              Coba lagi
            </button>
          </div>
        )}

        {loading ? (
          <p role="status" style={{ padding: '24px', color: '#7a6d64' }}>Memuat data laporan...</p>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <p>Penjualan Hari Ini</p>
                <h2>Rp {todaySales.toLocaleString('id-ID')}</h2>
              </div>
              <div className="stat-card">
                <p>Total Transaksi</p>
                <h2>{totalOrders} Pesanan</h2>
              </div>
              <div className="stat-card">
                <p>Produk Terlaris</p>
                <h2>{topProductName}</h2>
              </div>
              <div className="stat-card">
                <p>Kas Shift Aktif</p>
                <h2>{report?.active_shift ? 'Shift Aktif' : 'Belum Ada Shift'}</h2>
              </div>
            </div>

            <div className="report-content">
              <div className="chart-area">
                <h3>Tren Penjualan Harian (Per Jam)</h3>
                {hourlySales.length === 0 ? (
                  <div className="chart-placeholder">Belum ada transaksi hari ini.</div>
                ) : (
                  <ul className="summary-list" style={{ marginTop: '12px' }}>
                    {hourlySales.map((bucket) => (
                      <li key={bucket.hour}>
                        <span>{bucket.hour} ({bucket.orders} pesanan)</span>
                        <strong>Rp {Number(bucket.total || 0).toLocaleString('id-ID')}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="summary-area">
                <h3>Rekapitulasi Shift Kasir</h3>
                <ul className="summary-list">
                  <li><span>Kasir Bertugas</span> <strong>{activeCashierName}</strong></li>
                  <li><span>Modal Kas Awal</span> <strong>Rp {openingFloat.toLocaleString('id-ID')}</strong></li>
                  <li><span>Tunai Masuk</span> <strong className="text-green">Rp {cashSales.toLocaleString('id-ID')}</strong></li>
                  <li><span>QRIS / Non-Tunai</span> <strong className="text-blue">Rp {qrisSales.toLocaleString('id-ID')}</strong></li>
                </ul>
                <button type="button" className="btn-close-shift" onClick={loadReports}>
                  Segarkan Rekap Laporan
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
