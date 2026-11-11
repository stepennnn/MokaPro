import { useState, useEffect } from 'react';
import './TableSelectionModal.css';

const DEFAULT_TABLES = [
  { id: 't1', name: 'Meja 01', seats: '4 Kursi', maxSeats: 4 },
  { id: 't2', name: 'Meja 02', seats: '4 Kursi', maxSeats: 4 },
  { id: 't3', name: 'Meja 03', seats: '4 Kursi', maxSeats: 4 },
  { id: 't4', name: 'Meja 04', seats: '6 Kursi', maxSeats: 6 },
  { id: 't5', name: 'Meja 05', seats: '4 Kursi', maxSeats: 4 },
  { id: 't6', name: 'Bar Counter A', seats: '4 Kursi', maxSeats: 4 },
  { id: 't7', name: 'Outdoor 01', seats: '4 Kursi', maxSeats: 4 },
  { id: 't8', name: 'Outdoor 02', seats: '4 Kursi', maxSeats: 4 }
];

export default function TableSelectionModal({ isOpen, currentTable, onClose, onConfirmTable }) {
  const [tablesData, setTablesData] = useState(DEFAULT_TABLES);

  useEffect(() => {
    if (isOpen) {
      // Ambil data meja yang sedang terisi dari KDS
      const kdsOrders = JSON.parse(localStorage.getItem('mokapro_kds')) || [];
      // Filter pesanan yang belum selesai (status != Selesai)
      const occupiedTables = kdsOrders.filter(order => order.status !== 'Selesai').map(o => o.table);

      const updatedTables = DEFAULT_TABLES.map(table => ({
        ...table,
        available: !occupiedTables.includes(table.name)
      }));
      setTablesData(updatedTables);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="table-modal-overlay" onClick={onClose}>
      <div className="table-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="table-modal-header">
          <h2 className="table-modal-title">Denah Visual Meja</h2>
          <button className="table-modal-close-btn" onClick={onClose}>×</button>
        </div>
        <p className="table-modal-subtitle">Pilih nomor meja untuk pemesanan Dine-In.</p>

        <div className="table-grid">
          {tablesData.map((table) => {
            const isAvailable = table.available;
            return (
              <button
                key={table.id}
                type="button"
                className={`table-card ${isAvailable ? 'available' : 'occupied'}`}
                disabled={!isAvailable}
                onClick={() => onConfirmTable(table.name, 'Dine-In', table.maxSeats)}
              >
                <div className="table-card-icon">▦</div>
                <span className="table-card-name">{table.name}</span>
                <span className="table-card-status">
                  {isAvailable ? `Kosong (${table.seats})` : 'Terisi'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="table-modal-bottom">
          <button className="table-takeaway-btn" onClick={() => onConfirmTable('Tanpa Meja', 'Takeaway', 0)}>
            Tanpa Meja (Takeaway)
          </button>
        </div>
      </div>
    </div>
  );
}