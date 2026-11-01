import './OrderCard.css';

/**
 * OrderCard component
 * Card tampilan satu tiket pesanan di antrean KDS Barista
 *
 * @param {Object} props
 * @param {Object} props.order - Objek data pesanan
 * @param {string} props.order.id - ID pesanan (misal: 'ORD-1001')
 * @param {string} props.order.table - Nomor meja atau 'Takeaway'
 * @param {string} props.order.customer - Nama pelanggan
 * @param {'waiting'|'processing'|'completed'} props.order.status - Status pesanan
 * @param {string} props.order.itemsSummary - Rincian item pesanan dalam format teks ringkas
 * @param {string} [props.order.notes] - Catatan khusus / modifikasi pesanan
 * @param {Function} props.onStatusChange - Callback saat status pesanan diubah
 */
export default function OrderCard({ order, onStatusChange }) {
  if (!order) return null;

  const { id, table, customer, status, itemsSummary, notes } = order;

  const handleNextStatus = () => {
    if (status === 'waiting') {
      onStatusChange(id, 'processing');
    } else if (status === 'processing') {
      onStatusChange(id, 'completed');
    }
  };

  return (
    <article className={`order-card order-card--${status}`}>
      {/* Card Header: Order ID & Table / Order Type */}
      <header className="order-card-header">
        <span className="order-card-id">{id}</span>
        <span className="order-card-table">{table}</span>
      </header>

      {/* Card Body: Customer Meta, Item List, Notes */}
      <div className="order-card-body">
        <div className="order-card-customer">
          {customer} · {table}
        </div>

        <div className="order-card-items">
          {itemsSummary}
        </div>

        {notes && (
          <div className="order-card-notes">
            {notes}
          </div>
        )}
      </div>

      {/* Card Footer: Action Button / Completed State */}
      <footer className="order-card-footer">
        {status === 'waiting' && (
          <button
            type="button"
            className="order-card-btn order-card-btn--waiting"
            onClick={handleNextStatus}
          >
            Mulai Racik Pesanan
          </button>
        )}

        {status === 'processing' && (
          <button
            type="button"
            className="order-card-btn order-card-btn--processing"
            onClick={handleNextStatus}
          >
            <span className="order-card-check-icon" aria-hidden="true">✓</span>
            <span>Selesai &amp; Disajikan</span>
          </button>
        )}

        {status === 'completed' && (
          <div className="order-card-completed-status">
            <span className="order-card-check-icon" aria-hidden="true">✓</span>
            <span>Pesanan Sudah Selesai</span>
          </div>
        )}
      </footer>
    </article>
  );
}
