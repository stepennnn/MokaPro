import { useState, useEffect } from 'react';
import './TableSelectionModal.css';

const DEFAULT_TABLES = [
  { id: 't1', name: 'Meja 01', seats: '4 Kursi', status: 'Kosong', available: true },
  { id: 't2', name: 'Meja 02', seats: '4 Kursi', status: 'Terisi', available: false },
  { id: 't3', name: 'Meja 03', seats: '4 Kursi', status: 'Kosong', available: true },
  { id: 't4', name: 'Meja 04', seats: '6 Kursi', status: 'Terisi', available: false },
  { id: 't5', name: 'Meja 05', seats: '4 Kursi', status: 'Kosong', available: true },
  { id: 't6', name: 'Bar Counter A', seats: '4 Kursi', status: 'Kosong', available: true },
  { id: 't7', name: 'Outdoor 01', seats: '4 Kursi', status: 'Kosong', available: true },
  { id: 't8', name: 'Outdoor 02', seats: '4 Kursi', status: 'Kosong', available: true }
];

/**
 * TableSelectionModal component
 * Modal denah visual pemilihan meja untuk pesanan Dine-In atau Takeaway
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Status buka/tutup modal
 * @param {string} [props.currentTable='Meja 01'] - Meja yang sedang aktif
 * @param {Array} [props.tables] - Daftar meja dengan status keterisian
 * @param {Function} props.onClose - Callback saat modal ditutup
 * @param {Function} props.onConfirmTable - Callback saat meja dipilih (tableName, orderType)
 */
export default function TableSelectionModal({
  isOpen,
  currentTable = 'Meja 01',
  tables = DEFAULT_TABLES,
  onClose,
  onConfirmTable
}) {
  const [selected, setSelected] = useState(currentTable);

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

  if (!isOpen) {
    return null;
  }

  const handleSelectTable = (table) => {
    if (!table.available) return;
    setSelected(table.name);
    if (onConfirmTable) {
      onConfirmTable(table.name, 'Dine-In');
    }
    onClose();
  };

  const handleTakeaway = () => {
    setSelected('Tanpa Meja');
    if (onConfirmTable) {
      onConfirmTable('Tanpa Meja', 'Takeaway');
    }
    onClose();
  };

  return (
    <div
      className="table-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-modal-title"
    >
      <div
        className="table-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title & Close Button */}
        <div className="table-modal-header">
          <h2 id="table-modal-title" className="table-modal-title">
            Denah Visual Meja
          </h2>

          <button
            type="button"
            className="table-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup pemilihan meja"
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

        {/* Subtitle */}
        <p className="table-modal-subtitle">
          Pilih nomor meja untuk pemesanan Dine-In.
        </p>

        {/* Visual Tables Grid */}
        <div className="table-grid" role="group" aria-label="Daftar Meja Kafe">
          {tables.map((table) => {
            const isAvailable = table.available;
            const isSelected = selected === table.name;
            const cardClass = isAvailable
              ? `table-card available ${isSelected ? 'selected' : ''}`
              : 'table-card occupied';

            return (
              <button
                key={table.id}
                type="button"
                className={cardClass}
                disabled={!isAvailable}
                onClick={() => handleSelectTable(table)}
                aria-label={`${table.name}, ${table.status} (${table.seats})`}
              >
                {/* Table icon */}
                <div className="table-card-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>

                <span className="table-card-name">{table.name}</span>
                <span className="table-card-status">
                  {table.status} ({table.seats})
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Action: Tanpa Meja (Takeaway) */}
        <div className="table-modal-bottom">
          <button
            type="button"
            className="table-takeaway-btn"
            onClick={handleTakeaway}
          >
            Tanpa Meja (Takeaway)
          </button>
        </div>
      </div>
    </div>
  );
}
