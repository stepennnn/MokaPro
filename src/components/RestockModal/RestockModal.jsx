import { useState } from 'react';
import './RestockModal.css';

/**
 * RestockModal component
 * Modal untuk menambah stok bahan baku secara manual
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Array} props.items - Daftar bahan baku dari inventaris
 * @param {Function} props.onClose - Callback saat modal ditutup
 * @param {Function} props.onConfirm - Callback saat restock dikonfirmasi ({ itemId, additionalAmount })
 */
export default function RestockModal({ isOpen, items = [], onClose, onConfirm }) {
  const [selectedItemId, setSelectedItemId] = useState(() => (items[0] ? items[0].id : ''));
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!selectedItemId || isNaN(numAmount) || numAmount <= 0) return;

    onConfirm({
      itemId: Number(selectedItemId),
      additionalAmount: numAmount
    });
  };

  return (
    <div
      className="restock-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="restock-modal-title"
    >
      <div
        className="restock-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="restock-modal-header">
          <h2 id="restock-modal-title" className="restock-modal-title">
            Restock Bahan
          </h2>
          <button
            type="button"
            className="restock-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup modal restock"
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

        {/* Form Body */}
        <form className="restock-modal-form" onSubmit={handleSubmit}>
          {/* Field: Pilih bahan */}
          <div className="restock-form-group">
            <label htmlFor="restock-item-select" className="restock-form-label">
              Pilih bahan
            </label>
            <div className="restock-select-wrapper">
              <select
                id="restock-item-select"
                className="restock-select-input"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <span className="restock-select-arrow" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>
          </div>

          {/* Field: Jumlah tambahan */}
          <div className="restock-form-group">
            <label htmlFor="restock-amount-input" className="restock-form-label">
              Jumlah tambahan
            </label>
            <input
              id="restock-amount-input"
              type="number"
              inputMode="numeric"
              step="any"
              min="1"
              className="restock-text-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder=""
              autoFocus
            />
            <span className="restock-form-hint">
              Jumlah mengikuti satuan bahan (g, ml, pcs).
            </span>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            className="restock-submit-btn"
            disabled={!selectedItemId || !amount || parseFloat(amount) <= 0}
          >
            Simpan Restock
          </button>
        </form>
      </div>
    </div>
  );
}
