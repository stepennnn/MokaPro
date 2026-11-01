import './PaymentSuccessModal.css';

/**
 * PaymentSuccessModal component
 * Modal pemberitahuan status transaksi berhasil dicatat
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.transaction - Data transaksi ({ id, total, method, ... })
 * @param {Function} props.onClose - Callback saat modal ditutup via tombol '✕'
 * @param {Function} props.onViewReceipt - Callback untuk membuka modal struk pembayaran
 * @param {Function} props.onFinish - Callback untuk menyelesaikan transaksi & reset state
 */
export default function PaymentSuccessModal({
  isOpen,
  transaction,
  onClose,
  onViewReceipt,
  onFinish
}) {
  if (!isOpen || !transaction) return null;

  const formatRupiah = (val) =>
    `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

  const methodLabel =
    transaction.method === 'cash' || transaction.method === 'Tunai'
      ? 'Tunai'
      : 'QRIS';

  const trxId = transaction.id || 'TRX-01001';

  return (
    <div
      className="payment-success-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-success-title"
    >
      <div
        className="payment-success-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="payment-success-header">
          <h2 id="payment-success-title" className="payment-success-title">
            Pembayaran Berhasil
          </h2>
          <button
            type="button"
            className="payment-success-close-btn"
            onClick={onClose}
            aria-label="Tutup notifikasi pembayaran"
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="payment-success-body">
          {/* Green Checkmark Icon */}
          <div className="payment-success-icon-wrap" aria-hidden="true">
            <svg
              viewBox="0 0 32 32"
              width="36"
              height="36"
              fill="none"
              stroke="#10805d"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 17 13 24 26 9" />
            </svg>
          </div>

          {/* Heading & Subtitle */}
          <h3 className="payment-success-heading">Transaksi Tercatat!</h3>
          <p className="payment-success-desc">
            Pesanan dikirim ke antrean KDS. Struk dan riwayat transaksi tersimpan dalam browser.
          </p>

          {/* Amount Display */}
          <div className="payment-success-amount">
            {formatRupiah(transaction.total)}
          </div>

          {/* Transaction Meta */}
          <div className="payment-success-meta">
            {trxId} · {methodLabel}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="payment-success-actions">
          <button
            type="button"
            className="payment-success-btn btn-receipt"
            onClick={onViewReceipt}
          >
            Lihat Struk
          </button>
          <button
            type="button"
            className="payment-success-btn btn-finish"
            onClick={onFinish}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
