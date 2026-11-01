import { useState, useEffect } from 'react';
import './CustomizeProductModal.css';

const ICE_OPTIONS = ['Es Normal', 'Sedikit Es', 'Tanpa Es'];
const SUGAR_OPTIONS = ['Gula Normal', 'Sedikit Gula', 'Ekstra Gula'];

/**
 * CustomizeProductModal component
 * Modal kustomisasi produk sebelum masuk ke keranjang kasir
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Status buka/tutup modal
 * @param {Object} props.product - Data produk yang sedang dikustomisasi
 * @param {Function} props.onClose - Callback saat modal ditutup
 * @param {Function} props.onAddToCart - Callback untuk memasukkan produk yang telah dikonfigurasi ke keranjang
 */
export default function CustomizeProductModal({
  isOpen,
  product,
  onClose,
  onAddToCart
}) {
  const initialIce = 'Es Normal';
  const [selectedIce, setSelectedIce] = useState(initialIce);
  const [selectedSugar, setSelectedSugar] = useState('Gula Normal');
  const [customNote, setCustomNote] = useState('');

  // Handle tombol Escape untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) {
    return null;
  }

  const formatPrice = (val) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const handleConfirm = () => {
    // Susun ringkasan catatan modifikasi
    const notesArray = [];
    if (selectedIce) notesArray.push(selectedIce);
    if (selectedSugar) notesArray.push(selectedSugar);
    if (customNote.trim()) notesArray.push(customNote.trim());

    const finalNotes = notesArray.join(', ');

    onAddToCart({
      ...product,
      notes: finalNotes
    });

    onClose();
  };

  return (
    <div
      className="customize-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="customize-modal-title"
    >
      <div
        className="customize-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title & Close Button */}
        <div className="customize-modal-header">
          <h2 id="customize-modal-title" className="customize-modal-title">
            {product.name}
          </h2>

          <button
            type="button"
            className="customize-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup kustomisasi"
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

        {/* Product Price */}
        <div className="customize-modal-price">
          {formatPrice(product.price)}
        </div>

        {/* Option 1: Ice Level */}
        <div className="customize-option-group">
          <label className="customize-option-label">Opsi Es (Ice Level)</label>
          <div className="customize-option-buttons">
            {ICE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`customize-opt-btn ${selectedIce === opt ? 'active' : ''}`}
                onClick={() => setSelectedIce(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Option 2: Sugar Level */}
        <div className="customize-option-group">
          <label className="customize-option-label">Opsi Manis (Sugar Level)</label>
          <div className="customize-option-buttons">
            {SUGAR_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`customize-opt-btn ${selectedSugar === opt ? 'active' : ''}`}
                onClick={() => setSelectedSugar(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Option 3: Custom Notes */}
        <div className="customize-option-group">
          <label htmlFor="custom-notes-input" className="customize-option-label">
            Catatan Khusus
          </label>
          <input
            id="custom-notes-input"
            type="text"
            className="customize-notes-input"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder=""
          />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          className="customize-modal-submit-btn"
          onClick={handleConfirm}
        >
          + Masukkan ke Keranjang
        </button>
      </div>
    </div>
  );
}
