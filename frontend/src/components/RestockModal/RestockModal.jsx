import { useState } from 'react';
import './RestockModal.css';

function createDefaultReference() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `RST-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export default function RestockModal({ isOpen, onClose, stocks, onSave }) {
  const [selectedId, setSelectedId] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState(createDefaultReference);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const activeStocks = stocks.filter((item) => item.active !== false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = Number(amount);
    if (!selectedId || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Pilih bahan dan masukkan jumlah tambahan lebih dari 0.');
      return;
    }

    if (!reference.trim()) {
      setError('Nomor referensi restock wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        ingredientId: Number(selectedId),
        quantity: parsedAmount,
        reference: reference.trim(),
        note: note.trim(),
      });

      setSelectedId('');
      setAmount('');
      setNote('');
      setReference(createDefaultReference());
      onClose();
    } catch (requestError) {
      setError(requestError.message || 'Gagal menyimpan data restock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="restock-overlay" onClick={() => !submitting && onClose()}>
      <div className="restock-modal" onClick={(e) => e.stopPropagation()}>
        <div className="restock-header">
          <h2>Restock Bahan</h2>
          <button type="button" className="close-btn" onClick={onClose} disabled={submitting}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Pilih bahan</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="restock-input"
              disabled={submitting}
              required
            >
              <option value="">-- Pilih Bahan Raw --</option>
              {activeStocks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (Tersedia: {Number(item.available_quantity || 0).toLocaleString('id-ID')} {item.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Jumlah tambahan</label>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: 500"
              className="restock-input"
              disabled={submitting}
              required
            />
            <small className="helper-text">Jumlah mengikuti satuan bahan (g, ml, pcs).</small>
          </div>

          <div className="form-group">
            <label>Nomor Referensi</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Contoh: RST-20261124-001"
              className="restock-input"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label>Catatan (Opsional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Pengiriman supplier pagi"
              className="restock-input"
              disabled={submitting}
            />
          </div>

          {error && (
            <p role="alert" style={{ color: '#b91c1c', fontSize: '13px', marginBottom: '12px' }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-save-restock" disabled={submitting}>
            {submitting ? 'Menyimpan...' : 'Simpan Restock'}
          </button>
        </form>
      </div>
    </div>
  );
}
