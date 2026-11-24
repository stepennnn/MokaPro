import { useCallback, useEffect, useState } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import ReceiptModal from '../../components/ReceiptModal/ReceiptModal';
import { apiFetch } from '../../lib/api';
import './History.css';

function formatPaymentMethod(method) {
  if (!method) return '-';
  return String(method).toLowerCase() === 'qris' ? 'QRIS' : 'Tunai';
}

function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString('id-ID');
}

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrderHistory = useCallback(async () => {
    const response = await apiFetch('/api/orders');
    const payload = await response.json();
    return Array.isArray(payload.data) ? payload.data : [];
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setHistory(await fetchOrderHistory());
    } catch (requestError) {
      setError(requestError.message || 'Gagal memuat riwayat transaksi.');
    } finally {
      setLoading(false);
    }
  }, [fetchOrderHistory]);

  useEffect(() => {
    let cancelled = false;

    fetchOrderHistory()
      .then((data) => {
        if (!cancelled) {
          setHistory(data);
          setError('');
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || 'Gagal memuat riwayat transaksi.');
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
  }, [fetchOrderHistory]);

  const totalPendapatan = history.reduce((acc, curr) => acc + Number(curr.total || 0), 0);

  return (
    <div className="history-page">
      <DashboardNavbar />
      <main className="history-main">
        <div className="header-section">
          <h1 className="page-title">Riwayat Transaksi</h1>
          <p className="page-subtitle">Daftar pembayaran yang berhasil dikonfirmasi di database.</p>
        </div>

        {error && (
          <div role="alert" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '14px' }}>
            {error}{' '}
            <button type="button" onClick={loadOrders} style={{ marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              Coba lagi
            </button>
          </div>
        )}

        <div className="summary-cards">
          <div className="summary-card">
            <span className="card-label">Jumlah transaksi tersimpan</span>
            <span className="card-value">{history.length}</span>
          </div>
          <div className="summary-card">
            <span className="card-label">Total nominal tersimpan</span>
            <span className="card-value">Rp {totalPendapatan.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="log-section">
          <div className="log-header">
            <h3>Log Pembayaran</h3>
          </div>

          {loading ? (
            <div className="empty-log">
              <p role="status">Memuat riwayat transaksi...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-log">
              <p>Belum ada transaksi. Silakan buat pesanan di halaman Kasir.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Transaksi</th>
                  <th>Waktu</th>
                  <th>Tipe</th>
                  <th>Metode</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {history.map((trx) => (
                  <tr key={trx.id}>
                    <td><strong>{trx.order_number}</strong></td>
                    <td>{formatDateTime(trx.created_at)}</td>
                    <td>{trx.type}{trx.table_number ? ` (${trx.table_number})` : ''}</td>
                    <td>{formatPaymentMethod(trx.payment_method)}</td>
                    <td>{trx.status}</td>
                    <td>Rp {Number(trx.total || 0).toLocaleString('id-ID')}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(trx)}
                        style={{
                          backgroundColor: '#3b2519',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Lihat / Cetak Struk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <ReceiptModal
        isOpen={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
