import { useState } from 'react';
import './SeatSelectionModal.css';

export default function SeatSelectionModal({ isOpen, onClose, tableName, onConfirm }) {
  const [seats, setSeats] = useState(2);

  if (!isOpen) return null;

  return (
    <div className="seat-modal-overlay" onClick={onClose}>
      <div className="seat-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Konfirmasi Meja {tableName}</h3>
        <p>Berapa jumlah orang yang akan duduk?</p>
        
        <div className="seat-input-group">
          <button onClick={() => setSeats(prev => Math.max(1, prev - 1))}>-</button>
          <input type="number" value={seats} readOnly />
          <button onClick={() => setSeats(prev => prev + 1)}>+</button>
        </div>

        <div className="seat-modal-actions">
          <button className="btn-cancel" onClick={onClose}>Batal</button>
          <button className="btn-confirm" onClick={() => onConfirm(seats)}>Gunakan Meja</button>
        </div>
      </div>
    </div>
  );
}