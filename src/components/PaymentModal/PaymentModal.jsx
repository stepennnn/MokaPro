import { useState } from 'react';
import './PaymentModal.css';

/**
 * PaymentModal component
 * Modal metode pembayaran dengan dua mode: QRIS dan Tunai (Cash)
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {number} props.total - Total pembayaran (sudah termasuk pajak)
 * @param {Function} props.onClose
 * @param {Function} props.onPaymentConfirm - Callback saat pembayaran dikonfirmasi ({ method, cashReceived, change })
 */
export default function PaymentModal({ isOpen, total = 0, onClose, onPaymentConfirm }) {
  const [activeTab, setActiveTab] = useState('qris'); // 'qris' | 'cash'
  const [cashReceived, setCashReceived] = useState('');

  if (!isOpen) return null;

  const formatRupiah = (val) =>
    `Rp ${Number(val).toLocaleString('id-ID')}`;

  const cashReceivedNum = Number(String(cashReceived).replace(/\D/g, '')) || 0;
  const change = cashReceivedNum - total;
  const isUnderPaid = cashReceivedNum > 0 && change < 0;
  const isCashValid = cashReceivedNum >= total;

  const handleCashInput = (e) => {
    // Only allow numeric characters
    const raw = e.target.value.replace(/\D/g, '');
    setCashReceived(raw);
  };

  const handleConfirm = () => {
    if (activeTab === 'cash' && !isCashValid) return;
    onPaymentConfirm({
      method: activeTab,
      cashReceived: cashReceivedNum,
      change: activeTab === 'cash' ? change : 0
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCashReceived('');
  };

  return (
    <div
      className="payment-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div
        className="payment-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="payment-modal-header">
          <h2 id="payment-modal-title" className="payment-modal-title">
            Metode Pembayaran
          </h2>
          <button
            type="button"
            className="payment-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup metode pembayaran"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
              stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Total Bill Display */}
        <div className="payment-total-box">
          <span className="payment-total-label">Total Tagihan Transaksi</span>
          <span className="payment-total-amount">{formatRupiah(total)}</span>
        </div>

        {/* Method Tabs */}
        <div className="payment-tabs" role="tablist" aria-label="Metode Pembayaran">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'qris'}
            className={`payment-tab-btn ${activeTab === 'qris' ? 'active' : ''}`}
            onClick={() => handleTabChange('qris')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            QRIS Statis/Dinamis
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cash'}
            className={`payment-tab-btn ${activeTab === 'cash' ? 'active' : ''}`}
            onClick={() => handleTabChange('cash')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
            Tunai (Cash)
          </button>
        </div>

        {/* Tab Content */}
        <div className="payment-tab-content">
          {/* QRIS Tab */}
          {activeTab === 'qris' && (
            <div className="payment-qris-section" role="tabpanel">
              <div className="qris-code-wrap" aria-label="QR Code pembayaran QRIS">
                {/* SVG QR Code Placeholder — visual sesuai desain */}
                <svg
                  className="qris-code-svg"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Finder patterns (corners) */}
                  <rect x="8" y="8" width="24" height="24" rx="2" fill="#3b2519" />
                  <rect x="12" y="12" width="16" height="16" rx="1" fill="#fff" />
                  <rect x="16" y="16" width="8" height="8" rx="1" fill="#3b2519" />

                  <rect x="68" y="8" width="24" height="24" rx="2" fill="#3b2519" />
                  <rect x="72" y="12" width="16" height="16" rx="1" fill="#fff" />
                  <rect x="76" y="16" width="8" height="8" rx="1" fill="#3b2519" />

                  <rect x="8" y="68" width="24" height="24" rx="2" fill="#3b2519" />
                  <rect x="12" y="72" width="16" height="16" rx="1" fill="#fff" />
                  <rect x="16" y="76" width="8" height="8" rx="1" fill="#3b2519" />

                  {/* Data cells — representative pattern */}
                  <rect x="38" y="8" width="4" height="4" fill="#3b2519" />
                  <rect x="46" y="8" width="4" height="4" fill="#3b2519" />
                  <rect x="54" y="8" width="4" height="4" fill="#3b2519" />
                  <rect x="38" y="16" width="4" height="8" fill="#3b2519" />
                  <rect x="46" y="14" width="4" height="4" fill="#3b2519" />
                  <rect x="54" y="16" width="4" height="4" fill="#3b2519" />
                  <rect x="38" y="28" width="4" height="4" fill="#3b2519" />
                  <rect x="50" y="26" width="4" height="4" fill="#3b2519" />

                  <rect x="8" y="38" width="4" height="4" fill="#3b2519" />
                  <rect x="16" y="38" width="8" height="4" fill="#3b2519" />
                  <rect x="28" y="38" width="4" height="4" fill="#3b2519" />
                  <rect x="8" y="46" width="4" height="4" fill="#3b2519" />
                  <rect x="14" y="46" width="4" height="4" fill="#3b2519" />
                  <rect x="22" y="46" width="8" height="4" fill="#3b2519" />
                  <rect x="8" y="54" width="8" height="4" fill="#3b2519" />
                  <rect x="20" y="54" width="4" height="4" fill="#3b2519" />
                  <rect x="28" y="52" width="4" height="8" fill="#3b2519" />

                  <rect x="38" y="38" width="4" height="4" fill="#3b2519" />
                  <rect x="46" y="38" width="8" height="4" fill="#3b2519" />
                  <rect x="58" y="38" width="4" height="4" fill="#3b2519" />
                  <rect x="38" y="46" width="4" height="4" fill="#3b2519" />
                  <rect x="46" y="46" width="4" height="8" fill="#3b2519" />
                  <rect x="54" y="46" width="4" height="4" fill="#3b2519" />
                  <rect x="62" y="46" width="4" height="4" fill="#3b2519" />
                  <rect x="38" y="54" width="4" height="4" fill="#3b2519" />
                  <rect x="50" y="54" width="8" height="4" fill="#3b2519" />

                  <rect x="68" y="38" width="4" height="4" fill="#3b2519" />
                  <rect x="76" y="36" width="8" height="4" fill="#3b2519" />
                  <rect x="88" y="38" width="4" height="4" fill="#3b2519" />
                  <rect x="68" y="46" width="8" height="4" fill="#3b2519" />
                  <rect x="80" y="44" width="4" height="8" fill="#3b2519" />
                  <rect x="88" y="46" width="4" height="4" fill="#3b2519" />
                  <rect x="68" y="54" width="4" height="4" fill="#3b2519" />
                  <rect x="76" y="54" width="4" height="4" fill="#3b2519" />
                  <rect x="84" y="54" width="8" height="4" fill="#3b2519" />

                  <rect x="38" y="68" width="4" height="4" fill="#3b2519" />
                  <rect x="46" y="68" width="4" height="8" fill="#3b2519" />
                  <rect x="54" y="68" width="4" height="4" fill="#3b2519" />
                  <rect x="62" y="70" width="4" height="4" fill="#3b2519" />
                  <rect x="38" y="76" width="8" height="4" fill="#3b2519" />
                  <rect x="52" y="76" width="4" height="4" fill="#3b2519" />
                  <rect x="60" y="76" width="4" height="4" fill="#3b2519" />
                  <rect x="38" y="84" width="4" height="4" fill="#3b2519" />
                  <rect x="46" y="82" width="4" height="6" fill="#3b2519" />
                  <rect x="54" y="84" width="8" height="4" fill="#3b2519" />

                  <rect x="68" y="68" width="4" height="4" fill="#3b2519" />
                  <rect x="76" y="68" width="8" height="4" fill="#3b2519" />
                  <rect x="88" y="68" width="4" height="4" fill="#3b2519" />
                  <rect x="68" y="76" width="4" height="4" fill="#3b2519" />
                  <rect x="76" y="76" width="4" height="4" fill="#3b2519" />
                  <rect x="84" y="76" width="8" height="4" fill="#3b2519" />
                  <rect x="68" y="84" width="8" height="4" fill="#3b2519" />
                  <rect x="80" y="84" width="4" height="4" fill="#3b2519" />
                  <rect x="88" y="82" width="4" height="6" fill="#3b2519" />
                </svg>
              </div>
            </div>
          )}

          {/* Cash / Tunai Tab */}
          {activeTab === 'cash' && (
            <div className="payment-cash-section" role="tabpanel">
              <div className="cash-field-group">
                <label htmlFor="cash-received-input" className="cash-field-label">
                  Uang diterima (Rp)
                </label>
                <input
                  id="cash-received-input"
                  type="text"
                  inputMode="numeric"
                  className={`cash-input ${isUnderPaid ? 'cash-input-error' : ''}`}
                  value={cashReceived ? Number(cashReceived).toLocaleString('id-ID') : ''}
                  onChange={handleCashInput}
                  placeholder=""
                  autoFocus
                />
                {isUnderPaid && (
                  <span className="cash-input-hint-error" role="alert">
                    Uang kurang {formatRupiah(Math.abs(change))}
                  </span>
                )}
                {!isUnderPaid && cashReceived === '' && (
                  <span className="cash-input-hint">Masukkan nominal pembayaran.</span>
                )}
              </div>

              {cashReceivedNum >= total && cashReceivedNum > 0 && (
                <div className="cash-change-row">
                  <span className="cash-change-label">Kembalian</span>
                  <span className="cash-change-val">{formatRupiah(change)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          className={`payment-confirm-btn ${activeTab === 'cash' && !isCashValid ? 'disabled' : ''}`}
          disabled={activeTab === 'cash' && !isCashValid}
          onClick={handleConfirm}
        >
          <span>Konfirmasi Pembayaran</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
