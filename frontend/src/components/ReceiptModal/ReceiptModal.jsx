import { useEffect } from 'react';
import './ReceiptModal.css';

function formatRupiah(val) {
  return `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
}

function formatPaymentLabel(method) {
  if (!method) return '-';
  const normalized = String(method).toLowerCase();
  if (normalized === 'qris') return 'QRIS';
  if (normalized === 'cash' || normalized === 'tunai') return 'Tunai';
  if (normalized === 'card' || normalized === 'kartu') return 'Kartu';
  return method;
}

function formatReceiptDate(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReceiptModal({
  isOpen,
  order,
  cashReceived = null,
  change = null,
  taxRate = null,
  storeName = 'MokaPro POS',
  storeSubtitle = 'Cabang Utama Toko',
  fallbackCashierName = '',
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) {
    return null;
  }

  const subtotal = Number(order.subtotal || 0);
  const tax = Number(order.tax || 0);
  const total = Number(order.total || 0);
  const effectiveTaxPercent = taxRate !== null && Number.isFinite(Number(taxRate))
    ? Math.round(Number(taxRate) * 10000) / 100
    : (subtotal > 0 ? Math.round((tax / subtotal) * 10000) / 100 : 10);

  const isCash = ['cash', 'tunai'].includes(String(order.payment_method || '').toLowerCase());
  const cashierName = order.cashier?.name || fallbackCashierName || '-';
  const orderTypeDisplay = order.type === 'Dine-In' && order.table_number
    ? `Dine-In (${order.table_number}${order.seats ? ` · ${order.seats} Org` : ''})`
    : (order.type || '-');

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
        className="receipt-modal-shell"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="receipt-modal-topbar no-print">
          <h2 id="receipt-modal-title" className="receipt-topbar-title">
            Struk Transaksi Digital
          </h2>
          <button
            type="button"
            className="receipt-close-btn"
            onClick={onClose}
            aria-label="Tutup struk"
          >
            ×
          </button>
        </div>

        <div className="receipt-printable-area">
          <div className="receipt-store-header">
            <h3 className="receipt-store-name">{storeName}</h3>
            <p className="receipt-store-sub">{storeSubtitle}</p>
            <p className="receipt-store-tagline">POS &amp; Roastery OS</p>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-meta">
            <div className="receipt-meta-row">
              <span>No. Order</span>
              <strong>{order.order_number}</strong>
            </div>
            <div className="receipt-meta-row">
              <span>Tanggal</span>
              <span>{formatReceiptDate(order.created_at)}</span>
            </div>
            <div className="receipt-meta-row">
              <span>Kasir</span>
              <span>{cashierName}</span>
            </div>
            <div className="receipt-meta-row">
              <span>Tipe</span>
              <span>{orderTypeDisplay}</span>
            </div>
            <div className="receipt-meta-row">
              <span>Pembayaran</span>
              <span>{formatPaymentLabel(order.payment_method)}</span>
            </div>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-items">
            {(order.items || []).map((item, idx) => {
              const unitPrice = Number(item.price || 0);
              const qty = Number(item.quantity || 1);
              const lineTotal = unitPrice * qty;

              return (
                <div key={item.id ?? idx} className="receipt-item-block">
                  <div className="receipt-item-main">
                    <span className="receipt-item-name">{item.name}</span>
                    <span className="receipt-item-subtotal">{formatRupiah(lineTotal)}</span>
                  </div>
                  <div className="receipt-item-detail">
                    <span>{qty} × {formatRupiah(unitPrice)}</span>
                  </div>
                  {item.notes && (
                    <div className="receipt-item-notes">
                      Catatan: {item.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="receipt-divider" />

          <div className="receipt-totals">
            <div className="receipt-total-row">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            <div className="receipt-total-row">
              <span>Pajak (PB1 {effectiveTaxPercent}%)</span>
              <span>{formatRupiah(tax)}</span>
            </div>
            <div className="receipt-total-row receipt-grand-total">
              <span>Total Akhir</span>
              <span>{formatRupiah(total)}</span>
            </div>

            {isCash && cashReceived !== null && Number.isFinite(Number(cashReceived)) && (
              <>
                <div className="receipt-divider receipt-divider-light" />
                <div className="receipt-total-row">
                  <span>Uang Diterima</span>
                  <span>{formatRupiah(cashReceived)}</span>
                </div>
                <div className="receipt-total-row">
                  <span>Kembalian</span>
                  <span>{formatRupiah(change !== null ? change : Math.max(0, Number(cashReceived) - total))}</span>
                </div>
              </>
            )}
          </div>

          <div className="receipt-divider" />

          <div className="receipt-footer">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p className="receipt-footer-small">Simpan struk ini sebagai bukti pembayaran sah.</p>
          </div>
        </div>

        <div className="receipt-modal-actions no-print">
          <button
            type="button"
            className="receipt-btn-secondary"
            onClick={onClose}
          >
            Tutup
          </button>
          <button
            type="button"
            className="receipt-btn-primary"
            onClick={handlePrint}
          >
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
}
