import './Cart.css';

/**
 * Cart component
 * Menangani tampilan panel keranjang transaksi, perhitungan subtotal/pajak/total,
 * serta state kosong vs terisi sesuai desain Figma.
 *
 * @param {Object} props
 * @param {Array} props.cartItems - Array item keranjang [{ id, name, price, quantity, notes }]
 * @param {string} [props.orderType='Dine-In'] - Tipe pesanan ('Dine-In' | 'Takeaway')
 * @param {string} [props.tableLocation=''] - Lokasi meja (contoh: 'Meja 01' atau 'Tanpa Meja')
 * @param {Function} props.onUpdateQuantity - Callback (productId, newQuantity)
 * @param {Function} props.onResetCart - Callback untuk mengosongkan keranjang
 * @param {Function} [props.onHoldOrder] - Callback untuk tahan pesanan
 * @param {Function} [props.onCheckout] - Callback untuk proses bayar
 */
export default function Cart({
  cartItems = [],
  orderType = 'Dine-In',
  tableLocation = '',
  onUpdateQuantity,
  onResetCart,
  onHoldOrder,
  onCheckout
}) {
  const isCartEmpty = cartItems.length === 0;

  // Hitung subtotal, pajak PB1 10%, dan total pembayaran
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  const formatRupiah = (val) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const displayLocation = tableLocation || (isCartEmpty ? 'Tanpa Meja' : 'Meja 01');

  return (
    <aside className="cart-panel" aria-label="Keranjang Transaksi">
      {/* Header Bar */}
      <div className="cart-header">
        <div className="cart-header-title">
          <svg
            className="cart-header-icon"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="8" y1="9" x2="16" y2="9" />
            <line x1="8" y1="13" x2="14" y2="13" />
            <line x1="8" y1="17" x2="11" y2="17" />
          </svg>
          <span>Keranjang Transaksi</span>
        </div>

        <button
          type="button"
          className="cart-reset-btn"
          onClick={onResetCart}
          disabled={isCartEmpty}
        >
          Reset
        </button>
      </div>

      {/* Order Meta Bar */}
      <div className="cart-meta-bar">
        <span className="cart-meta-type">Tipe: {orderType}</span>
        <span className="cart-meta-location">Lokasi: <strong>{displayLocation}</strong></span>
      </div>

      {/* Cart Content: Empty vs Populated */}
      <div className="cart-body">
        {isCartEmpty ? (
          <div className="cart-empty-state">
            <p className="cart-empty-title">Keranjang masih kosong.</p>
            <p className="cart-empty-sub">Tekan + pada menu untuk menambah produk.</p>
          </div>
        ) : (
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item-card">
                <div className="cart-item-header">
                  <h4 className="cart-item-name">{item.name}</h4>
                  {item.notes && (
                    <span className="cart-item-notes">{item.notes}</span>
                  )}
                </div>

                <div className="cart-item-footer">
                  <span className="cart-item-total-price">
                    {formatRupiah(item.price * item.quantity)}
                  </span>

                  {/* Quantity Stepper */}
                  <div className="cart-qty-stepper">
                    <button
                      type="button"
                      className="cart-qty-btn"
                      aria-label="Kurangi kuantitas"
                      onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      –
                    </button>
                    <span className="cart-qty-value">{item.quantity}</span>
                    <button
                      type="button"
                      className="cart-qty-btn"
                      aria-label="Tambah kuantitas"
                      onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Calculation & Actions */}
      <div className="cart-footer">
        <div className="cart-summary-row">
          <span className="cart-summary-label">Subtotal</span>
          <span className="cart-summary-val">{formatRupiah(subtotal)}</span>
        </div>

        <div className="cart-summary-row">
          <span className="cart-summary-label">Pajak Resto (PB1 10%)</span>
          <span className="cart-summary-val">{formatRupiah(tax)}</span>
        </div>

        <div className="cart-summary-row cart-total-row">
          <span className="cart-total-label">Total Pembayaran</span>
          <span className="cart-total-val">{formatRupiah(total)}</span>
        </div>

        {/* Action Buttons */}
        <div className="cart-actions-row">
          <button
            type="button"
            className="cart-hold-btn"
            disabled={isCartEmpty}
            onClick={onHoldOrder}
          >
            Tahan Pesanan
          </button>

          <button
            type="button"
            className="cart-checkout-btn"
            disabled={isCartEmpty}
            onClick={onCheckout}
          >
            <span>Proses Bayar</span>
            <svg
              className="checkout-arrow"
              viewBox="0 0 24 24"
              width="14"
              height="14"
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
        </div>
      </div>
    </aside>
  );
}
