import { useState, useEffect } from 'react';
import './CustomizeProductModal.css';

const ICE_OPTIONS = ['Es Normal', 'Sedikit Es', 'Tanpa Es'];
const SUGAR_OPTIONS = ['Gula Normal', 'Sedikit Gula', 'Ekstra Gula'];

/**
 * CustomizeProductModal component
 * Modal kustomisasi produk sebelum masuk ke keranjang kasir
 */
export default function CustomizeProductModal({
  isOpen,
  product,
  onClose,
  onAddToCart
}) {
  const productModifiers = Array.isArray(product?.modifiers) ? product.modifiers : [];
  const hasCustomModifiers = productModifiers.length > 0;

  const initialIce = product?.name === 'Kopi Susu Gula Aren' ? 'Sedikit Es' : 'Es Normal';
  const [selectedIce, setSelectedIce] = useState(initialIce);
  const [selectedSugar, setSelectedSugar] = useState('Gula Normal');
  const [selectedModifiers, setSelectedModifiers] = useState(() => {
    const defaults = {};
    productModifiers.forEach((mod) => {
      if (mod.type === 'choice') {
        const choices = String(mod.value || '').split(',').map((s) => s.trim()).filter(Boolean);
        defaults[mod.id] = choices[0] || mod.value || '';
      } else if (mod.type === 'boolean') {
        defaults[mod.id] = false;
      } else {
        defaults[mod.id] = '';
      }
    });
    return defaults;
  });
  const [customNote, setCustomNote] = useState('');

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
    return `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
  };

  const handleConfirm = () => {
    const notesArray = [];
    const chosenModifierIds = [];

    if (hasCustomModifiers) {
      productModifiers.forEach((mod) => {
        const val = selectedModifiers[mod.id];
        if (mod.type === 'boolean' && val) {
          notesArray.push(mod.name);
          chosenModifierIds.push(Number(mod.id));
        } else if (typeof val === 'string' && val.trim()) {
          notesArray.push(`${mod.name}: ${val.trim()}`);
          chosenModifierIds.push(Number(mod.id));
        }
      });
    } else {
      if (selectedIce) notesArray.push(selectedIce);
      if (selectedSugar) notesArray.push(selectedSugar);
    }

    if (customNote.trim()) notesArray.push(customNote.trim());

    onAddToCart({
      ...product,
      notes: notesArray.join(', '),
      modifierIds: chosenModifierIds,
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

        <div className="customize-modal-price">
          {formatPrice(product.price)}
        </div>

        {hasCustomModifiers ? (
          productModifiers.map((mod) => {
            if (mod.type === 'choice') {
              const choices = String(mod.value || '').split(',').map((s) => s.trim()).filter(Boolean);
              const options = choices.length > 0 ? choices : [mod.value];
              return (
                <div key={mod.id} className="customize-option-group">
                  <label className="customize-option-label">{mod.name}</label>
                  <div className="customize-option-buttons">
                    {options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`customize-opt-btn ${selectedModifiers[mod.id] === opt ? 'active' : ''}`}
                        onClick={() => setSelectedModifiers((prev) => ({ ...prev, [mod.id]: opt }))}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            if (mod.type === 'boolean') {
              const active = Boolean(selectedModifiers[mod.id]);
              return (
                <div key={mod.id} className="customize-option-group">
                  <label className="customize-option-label">{mod.name}</label>
                  <div className="customize-option-buttons">
                    <button
                      type="button"
                      className={`customize-opt-btn ${active ? 'active' : ''}`}
                      onClick={() => setSelectedModifiers((prev) => ({ ...prev, [mod.id]: !active }))}
                    >
                      {active ? `Ya (${mod.value})` : `Tambah ${mod.name}`}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={mod.id} className="customize-option-group">
                <label htmlFor={`mod-input-${mod.id}`} className="customize-option-label">
                  {mod.name}
                </label>
                <input
                  id={`mod-input-${mod.id}`}
                  type="text"
                  className="customize-notes-input"
                  value={selectedModifiers[mod.id] || ''}
                  onChange={(e) => setSelectedModifiers((prev) => ({ ...prev, [mod.id]: e.target.value }))}
                  placeholder={mod.value || ''}
                />
              </div>
            );
          })
        ) : (
          <>
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
          </>
        )}

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
