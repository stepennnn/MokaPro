import { useCallback, useEffect, useState } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import { apiFetch } from '../../lib/api';
import './KDS.css';

function formatPaymentMethod(method) {
  if (!method) return '-';
  return String(method).toLowerCase() === 'qris' ? 'QRIS' : 'Tunai';
}

function formatOrderTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function KDS() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchKdsOrders = useCallback(async () => {
    const response = await apiFetch('/api/kds/orders');
    const payload = await response.json();
    return Array.isArray(payload.data) ? payload.data : [];
  }, []);

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');

    try {
      setOrders(await fetchKdsOrders());
    } catch (requestError) {
      setError(requestError.message || 'Gagal memuat antrean pesanan dapur.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [fetchKdsOrders]);

  useEffect(() => {
    let cancelled = false;

    fetchKdsOrders()
      .then((data) => {
        if (!cancelled) {
          setOrders(data);
          setError('');
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || 'Gagal memuat antrean pesanan dapur.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    const intervalId = window.setInterval(() => {
      fetchKdsOrders()
        .then((data) => {
          if (!cancelled) {
            setOrders(data);
            setError('');
          }
        })
        .catch((requestError) => {
          if (!cancelled) {
            setError(requestError.message || 'Gagal memuat antrean pesanan dapur.');
          }
        });
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [fetchKdsOrders]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    setError('');

    try {
      const response = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      const payload = await response.json();
      const updatedOrder = payload.data;

      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? updatedOrder : order)),
      );
    } catch (requestError) {
      setError(requestError.message || 'Gagal memperbarui status pesanan.');
    } finally {
      setUpdatingId(null);
    }
  };

  const countMenunggu = orders.filter((o) => o.status === 'Menunggu').length;
  const countDiproses = orders.filter((o) => o.status === 'Diproses').length;
  const countSelesai = orders.filter((o) => o.status === 'Selesai').length;

  return (
    <div className="kds-page">
      <DashboardNavbar />
      <main className="kds-main">
        <div className="kds-header">
          <div>
            <h1 className="page-title">Antrean Pesanan Barista &amp; Dapur</h1>
            <p className="page-subtitle">Monitor pesanan langsung tanpa cetak struk (Paperless KDS)</p>
          </div>

          <div className="filter-tabs">
            <span className="tab pending">Menunggu: {countMenunggu}</span>
            <span className="tab processing">Diproses: {countDiproses}</span>
            <span className="tab done">Selesai: {countSelesai}</span>
            <button
              type="button"
              className="tab"
              onClick={() => loadOrders()}
              disabled={loading}
              style={{ cursor: 'pointer' }}
            >
              Segarkan
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div className="kds-grid">
          {loading ? (
            <div className="empty-kds" style={{ padding: '40px', textAlign: 'center', color: '#7a6d64', gridColumn: '1 / -1' }}>
              Memuat antrean pesanan...
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-kds" style={{ padding: '40px', textAlign: 'center', color: '#7a6d64', gridColumn: '1 / -1' }}>
              Belum ada antrean pesanan masuk dari Kasir.
            </div>
          ) : (
            orders.map((order) => {
              const tableLabel = order.table_number || 'Tanpa Meja';
              const isBusy = updatingId === order.id;

              return (
                <div
                  key={order.id}
                  className={`kds-card ${
                    order.status === 'Menunggu'
                      ? 'pending'
                      : order.status === 'Diproses'
                        ? 'processing'
                        : 'completed'
                  }`}
                >
                  <div className="kds-card-header">
                    <span className="order-id">{order.order_number}</span>
                    <span className="order-table">
                      {tableLabel} {order.seats > 0 && tableLabel !== 'Tanpa Meja' ? `(${order.seats} Org)` : ''}
                    </span>
                    <span className="order-time">⏱ {formatOrderTime(order.created_at)}</span>
                  </div>

                  <p className="customer-info">{order.type} • {formatPaymentMethod(order.payment_method)}</p>

                  <div className="kds-card-body">
                    {(order.items || []).map((item) => (
                      <div key={item.id}>
                        <p><strong>{item.quantity}x</strong> {item.name}</p>
                        {item.notes && <p className="notes">{item.notes}</p>}
                      </div>
                    ))}
                  </div>

                  {order.status === 'Menunggu' && (
                    <button
                      type="button"
                      className="kds-btn process"
                      disabled={isBusy}
                      onClick={() => updateStatus(order.id, 'Diproses')}
                    >
                      {isBusy ? 'Memperbarui...' : 'Mulai Racik Pesanan'}
                    </button>
                  )}

                  {order.status === 'Diproses' && (
                    <button
                      type="button"
                      className="kds-btn done"
                      disabled={isBusy}
                      onClick={() => updateStatus(order.id, 'Selesai')}
                    >
                      {isBusy ? 'Memperbarui...' : '✓ Selesai & Disajikan'}
                    </button>
                  )}

                  {order.status === 'Selesai' && (
                    <div className="completed-status">✓ Pesanan Sudah Selesai</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
