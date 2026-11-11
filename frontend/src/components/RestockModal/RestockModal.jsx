import { useState } from 'react';
import './RestockModal.css';

export default function RestockModal({ isOpen, onClose, stocks, onSave }) {
  const [selectedId, setSelectedId] = useState('');
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedId || !amount) return alert('Pilih bahan dan masukkan jumlah!');
    
    // Kirim data ke halaman induk
    onSave(parseInt(selectedId), parseInt(amount));
    
    // Reset form
    setSelectedId('');
    setAmount('');
    onClose();
  };

  return (
    <div className="restock-overlay" onClick={onClose}>
      <div className="restock-modal" onClick={(e) => e.stopPropagation()}>
        <div className="restock-header">
          <h2>Restock Bahan</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Pilih bahan</label>
            <select 
              value={selectedId} 
              onChange={(e) => setSelectedId(e.target.value)}
              className="restock-input"
            >
              <option value="">-- Pilih Bahan Raw --</option>
              {stocks.map(item => (
                <option key={item.id} value={item.id}>{item.name} (Sisa: {item.stock} {item.unit})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Jumlah tambahan</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: 500" 
              className="restock-input"
            />
            <small className="helper-text">Jumlah mengikuti satuan bahan (g, ml, pcs).</small>
          </div>

          <button type="submit" className="btn-save-restock">
            Simpan Restock
          </button>
        </form>
      </div>
    </div>
  );
}