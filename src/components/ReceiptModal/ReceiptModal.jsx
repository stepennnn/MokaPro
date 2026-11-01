import './ReceiptModal.css';

/**
 * ReceiptModal component
 * Modal struk pembayaran digital fisik/layar
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.transaction - Data transaksi lengkap
 * @param {Function} props.onClose - Callback saat modal ditutup (selesai transaksi)
 */
export default function ReceiptModal({ isOpen, transaction, onClose }) {
  if (!isOpen || !transaction) return null;

  const formatRupiah = (val) =>
    `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

  const formatDate = (date) => {
    const d = date ? new Date(date) : new Date();
    const day = d.getDate();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}.${minutes}`;
  };

  const isCash =
    transaction.method === 'cash' || transaction.method === 'Tunai';
  const methodLabel = isCash ? 'Tunai' : 'QRIS';

  // Format Tipe / lokasi
  const orderType = transaction.orderType || 'Dine-In';
  const tableLocation = transaction.selectedTable || 'Meja 01';
  const typeLocationLabel =
    orderType === 'Takeaway'
      ? 'Takeaway · Takeaway'
      : `${orderType} · ${tableLocation}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="receipt-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div
        className="receipt-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="receipt-modal-header">
          <h2 id="receipt-modal-title" className="receipt-modal-title">
            Struk Pembayaran
          </h2>
          <button
            type="button"
            className="receipt-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup struk pembayaran"
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

        {/* Receipt Paper Card */}
        <div className="receipt-paper-wrapper">
          <div className="receipt-paper" id="receipt-printable-area">
            {/* Brand Header */}
            <div className="receipt-brand-header">
              <div className="receipt-brand-logo">
                <span className="receipt-coffee-icon" aria-hidden="true">
                  ☕
                </span>
                <span className="receipt-brand-name">MokaPro</span>
              </div>
              <div className="receipt-store-branch">Cabang Utama Toko</div>
              <div className="receipt-title-badge">STRUK PEMBAYARAN</div>
            </div>

            {/* Meta Info Rows */}
            <div className="receipt-meta-section">
              <div className="receipt-meta-row">
                <span className="receipt-meta-label">No. transaksi</span>
                <span className="receipt-meta-val">{transaction.id || 'TRX-01001'}</span>
              </div>
              <div className="receipt-meta-row">
                <span className="receipt-meta-label">Waktu</span>
                <span className="receipt-meta-val">{formatDate(transaction.timestamp)}</span>
              </div>
              <div className="receipt-meta-row">
                <span className="receipt-meta-label">Kasir</span>
                <span className="receipt-meta-val">{transaction.cashierName || 'Kasir 01'}</span>
              </div>
              <div className="receipt-meta-row">
                <span className="receipt-meta-label">Tipe / lokasi</span>
                <span className="receipt-meta-val">{typeLocationLabel}</span>
              </div>
            </div>

            <div className="receipt-divider" />

            {/* Purchased Items List */}
            <div className="receipt-items-section">
              {transaction.cartItems && transaction.cartItems.length > 0 ? (
                transaction.cartItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="receipt-item-row">
                    <div className="receipt-item-name">{item.name}</div>
                    <div className="receipt-item-calc">
                      <span className="receipt-item-qty-price">
                        {item.quantity} × {formatRupiah(item.price)}
                      </span>
                      <span className="receipt-item-subtotal">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                    {item.notes && (
                      <div className="receipt-item-notes">{item.notes}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="receipt-item-empty">Tidak ada item</div>
              )}
            </div>

            <div className="receipt-divider" />

            {/* Calculations & Totals */}
            <div className="receipt-totals-section">
              <div className="receipt-total-row">
                <span className="receipt-total-label">Subtotal</span>
                <span className="receipt-total-val">{formatRupiah(transaction.subtotal)}</span>
              </div>
              <div className="receipt-total-row">
                <span className="receipt-total-label">Pajak PB1 (10%)</span>
                <span className="receipt-total-val">
                  {formatRupiah(transaction.pb1 ?? Math.round(transaction.subtotal * 0.1))}
                </span>
              </div>
              <div className="receipt-total-row receipt-grand-total">
                <span className="receipt-total-label">TOTAL</span>
                <span className="receipt-total-val">{formatRupiah(transaction.total)}</span>
              </div>
              <div className="receipt-total-row">
                <span className="receipt-total-label">Metode</span>
                <span className="receipt-total-val">{methodLabel}</span>
              </div>

              {/* If Cash method, show cashReceived & change */}
              {isCash && (
                <>
                  <div className="receipt-total-row">
                    <span className="receipt-total-label">Uang Diterima</span>
                    <span className="receipt-total-val">
                      {formatRupiah(transaction.cashReceived || transaction.total)}
                    </span>
                  </div>
                  <div className="receipt-total-row">
                    <span className="receipt-total-label">Kembalian</span>
                    <span className="receipt-total-val">
                      {formatRupiah(transaction.change || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="receipt-divider" />

            {/* Receipt Footer Message */}
            <div className="receipt-footer-msg">
              <div className="receipt-status-text">PEMBAYARAN BERHASIL</div>
              <div className="receipt-thank-text">Terima kasih telah berkunjung!</div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="receipt-modal-actions">
          <button
            type="button"
            className="receipt-action-btn btn-print"
            onClick={handlePrint}
          >
            <svg
              className="receipt-btn-icon"
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Cetak Struk</span>
          </button>
          <button
            type="button"
            className="receipt-action-btn btn-close"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
