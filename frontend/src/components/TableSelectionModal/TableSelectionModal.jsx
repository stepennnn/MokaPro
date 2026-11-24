import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import './TableSelectionModal.css';

export default function TableSelectionModal({ isOpen, onClose, onConfirmTable }) {
  const [tablesData, setTablesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    apiFetch('/api/tables')
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) {
          setTablesData(Array.isArray(payload.data) ? payload.data : []);
          setError('');
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || 'Gagal memuat status meja.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="table-modal-overlay" onClick={onClose}>
      <div className="table-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="table-modal-header">
          <h2 className="table-modal-title">Denah Visual Meja</h2>
          <button type="button" className="table-modal-close-btn" onClick={onClose}>×</button>
        </div>
        <p className="table-modal-subtitle">Pilih nomor meja untuk pemesanan Dine-In.</p>

        {loading ? (
          <p role="status" style={{ padding: '20px', textAlign: 'center', color: '#7a6d64' }}>
            Memuat ketersediaan meja...
          </p>
        ) : error ? (
          <p role="alert" style={{ padding: '16px', textAlign: 'center', color: '#b91c1c' }}>
            {error}
          </p>
        ) : (
          <div className="table-grid">
            {tablesData.map((table) => {
              const isAvailable = Boolean(table.available);
              return (
                <button
                  key={table.code || table.id}
                  type="button"
                  className={`table-card ${isAvailable ? 'available' : 'occupied'}`}
                  disabled={!isAvailable}
                  onClick={() => onConfirmTable(table.name, 'Dine-In', table.capacity)}
                >
                  <div className="table-card-icon">▦</div>
                  <span className="table-card-name">{table.name}</span>
                  <span className="table-card-status">
                    {isAvailable ? `Kosong (${table.capacity} Kursi)` : 'Terisi'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="table-modal-bottom">
          <button type="button" className="table-takeaway-btn" onClick={() => onConfirmTable('Tanpa Meja', 'Takeaway', 0)}>
            Tanpa Meja (Takeaway)
          </button>
        </div>
      </div>
    </div>
  );
}
