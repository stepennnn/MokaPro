import { useCallback, useEffect, useState } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import RestockModal from '../../components/RestockModal/RestockModal';
import { apiFetch } from '../../lib/api';
import './Inventory.css';

function formatQuantity(value) {
  const num = Number(value || 0);
  return num.toLocaleString('id-ID', { maximumFractionDigits: 3 });
}

function toThreeDecimalString(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return null;
  }
  return num.toFixed(3);
}

export default function Inventory() {
  const [stocks, setStocks] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);

  // Create ingredient form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: '',
    name: '',
    unit: 'g',
    minimum_stock: '0',
    active: true,
  });
  const [creatingIngredient, setCreatingIngredient] = useState(false);

  // Edit ingredient inline state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    unit: 'g',
    minimum_stock: '0',
    active: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchInventoryData = useCallback(async () => {
    const [inventoryResponse, productsResponse] = await Promise.all([
      apiFetch('/api/admin/inventory'),
      apiFetch('/api/products'),
    ]);

    const [inventoryPayload, productsPayload] = await Promise.all([
      inventoryResponse.json(),
      productsResponse.json(),
    ]);

    return {
      stocks: Array.isArray(inventoryPayload.data) ? inventoryPayload.data : [],
      lowStockItems: Array.isArray(inventoryPayload.low_stock) ? inventoryPayload.low_stock : [],
      products: Array.isArray(productsPayload.data) ? productsPayload.data : [],
    };
  }, []);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await fetchInventoryData();
      setStocks(result.stocks);
      setLowStockItems(result.lowStockItems);
      setProducts(result.products);
    } catch (requestError) {
      setError(requestError.message || 'Gagal memuat data inventaris dari server.');
    } finally {
      setLoading(false);
    }
  }, [fetchInventoryData]);

  useEffect(() => {
    let cancelled = false;

    fetchInventoryData()
      .then((result) => {
        if (!cancelled) {
          setStocks(result.stocks);
          setLowStockItems(result.lowStockItems);
          setProducts(result.products);
          setError('');
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || 'Gagal memuat data inventaris dari server.');
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
  }, [fetchInventoryData]);

  const handleRestockSave = async ({ ingredientId, quantity, reference, note }) => {
    setFeedback('');

    await apiFetch('/api/admin/restocks', {
      method: 'POST',
      body: JSON.stringify({
        reference,
        note: note || null,
        items: [
          {
            ingredient_id: Number(ingredientId),
            quantity: Number(quantity).toFixed(3),
          },
        ],
      }),
    });

    await loadInventory();
    setFeedback(`Stok berhasil ditambahkan (Ref: ${reference}).`);
  };

  const handleCreateIngredient = async (e) => {
    e.preventDefault();
    const minStock = toThreeDecimalString(createForm.minimum_stock);
    if (!createForm.code.trim() || !createForm.name.trim() || !createForm.unit.trim() || minStock === null) {
      setError('Lengkapi kode, nama, satuan unit, dan stok minimum bahan baku yang valid.');
      return;
    }

    setCreatingIngredient(true);
    setError('');
    setFeedback('');

    try {
      await apiFetch('/api/admin/ingredients', {
        method: 'POST',
        body: JSON.stringify({
          code: createForm.code.trim(),
          name: createForm.name.trim(),
          unit: createForm.unit.trim(),
          minimum_stock: minStock,
          active: Boolean(createForm.active),
        }),
      });

      setCreateForm({
        code: '',
        name: '',
        unit: 'g',
        minimum_stock: '0',
        active: true,
      });
      setShowCreateForm(false);
      await loadInventory();
      setFeedback('Bahan baku baru berhasil ditambahkan.');
    } catch (requestError) {
      setError(requestError.message || 'Gagal menambahkan bahan baku.');
    } finally {
      setCreatingIngredient(false);
    }
  };

  const handleStartEdit = (item) => {
    setError('');
    setFeedback('');
    setEditingId(item.id);
    setEditForm({
      code: item.code || '',
      name: item.name || '',
      unit: item.unit || 'g',
      minimum_stock: String(Number(item.minimum_stock || 0)),
      active: Boolean(item.active),
    });
  };

  const handleSaveEdit = async () => {
    const minStock = toThreeDecimalString(editForm.minimum_stock);
    if (!editForm.code.trim() || !editForm.name.trim() || !editForm.unit.trim() || minStock === null) {
      setError('Pastikan kode, nama, satuan unit, dan stok minimum valid.');
      return;
    }

    setSavingEdit(true);
    setError('');
    setFeedback('');

    try {
      await apiFetch(`/api/admin/ingredients/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          code: editForm.code.trim(),
          name: editForm.name.trim(),
          unit: editForm.unit.trim(),
          minimum_stock: minStock,
          active: Boolean(editForm.active),
        }),
      });

      setEditingId(null);
      await loadInventory();
      setFeedback('Data bahan baku berhasil diperbarui.');
    } catch (requestError) {
      setError(requestError.message || 'Gagal memperbarui data bahan baku.');
    } finally {
      setSavingEdit(false);
    }
  };

  const lowStockCount = lowStockItems.length;

  return (
    <div className="inventory-page">
      <DashboardNavbar />
      <main className="inventory-main">
        {lowStockCount > 0 && (
          <div className="alert-banner">
            ⚠️ <strong>Peringatan Stok Menipis</strong> <br />
            <span>
              {lowStockCount} bahan berada di bawah ambang batas minimum stok
              ({lowStockItems.map((item) => item.name).join(', ')}).
            </span>
          </div>
        )}

        {error && (
          <div role="alert" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {feedback && (
          <div role="status" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#eef8f0', color: '#1f6e3d', fontSize: '14px' }}>
            {feedback}
          </div>
        )}

        <div className="inventory-content">
          <div className="raw-materials-panel">
            <div className="panel-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <h3>Inventaris Bahan Raw (Otomatis Terpotong)</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-restock"
                  style={{ backgroundColor: '#6f4e37' }}
                  onClick={() => {
                    setShowCreateForm((prev) => !prev);
                    setError('');
                    setFeedback('');
                  }}
                >
                  {showCreateForm ? 'Tutup Form' : '+ Tambah Bahan'}
                </button>
                <button
                  type="button"
                  className="btn-restock"
                  onClick={() => setIsRestockModalOpen(true)}
                  disabled={loading || stocks.filter((s) => s.active !== false).length === 0}
                >
                  + Restock Bahan
                </button>
              </div>
            </div>

            {showCreateForm && (
              <form
                onSubmit={handleCreateIngredient}
                style={{
                  marginBottom: '20px',
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: '#faf7f2',
                  border: '1px solid #ede5dc',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '10px',
                  alignItems: 'end',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Kode Bahan</label>
                  <input
                    type="text"
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    placeholder="Contoh: BEANS-01"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #dcd4cb', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Nama Bahan</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Biji Kopi Arabica"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #dcd4cb', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Satuan Unit</label>
                  <input
                    type="text"
                    value={createForm.unit}
                    onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })}
                    placeholder="g / ml / pcs"
                    maxLength={16}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #dcd4cb', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Min. Stok</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={createForm.minimum_stock}
                    onChange={(e) => setCreateForm({ ...createForm, minimum_stock: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #dcd4cb', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Status</label>
                  <select
                    value={createForm.active ? 'Aktif' : 'Nonaktif'}
                    onChange={(e) => setCreateForm({ ...createForm, active: e.target.value === 'Aktif' })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #dcd4cb', boxSizing: 'border-box' }}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
                <div>
                  <button type="submit" className="btn-restock" disabled={creatingIngredient} style={{ width: '100%' }}>
                    {creatingIngredient ? 'Menyimpan...' : 'Simpan Bahan'}
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <p role="status" style={{ padding: '24px', textAlign: 'center', color: '#7a6d64' }}>
                Memuat data inventaris...
              </p>
            ) : stocks.length === 0 ? (
              <p style={{ padding: '24px', textAlign: 'center', color: '#7a6d64' }}>
                Belum ada bahan baku terdaftar. Klik &quot;+ Tambah Bahan&quot; untuk menambahkan.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bahan Raw</th>
                    <th>Tersedia</th>
                    <th>Min. Stok</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((item) => (
                    <tr key={item.id}>
                      {editingId === item.id ? (
                        <>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '8px' }}>
                              <input
                                type="text"
                                value={editForm.code}
                                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                placeholder="Kode"
                                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #dcd4cb', fontSize: '12px' }}
                              />
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Nama bahan"
                                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #dcd4cb', fontSize: '12px' }}
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editForm.unit}
                              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                              maxLength={16}
                              style={{ width: '64px', padding: '6px', borderRadius: '4px', border: '1px solid #dcd4cb', fontSize: '12px' }}
                              title="Satuan unit"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              value={editForm.minimum_stock}
                              onChange={(e) => setEditForm({ ...editForm, minimum_stock: e.target.value })}
                              style={{ width: '90px', padding: '6px', borderRadius: '4px', border: '1px solid #dcd4cb', fontSize: '12px' }}
                            />
                          </td>
                          <td>
                            <select
                              value={editForm.active ? 'Aktif' : 'Nonaktif'}
                              onChange={(e) => setEditForm({ ...editForm, active: e.target.value === 'Aktif' })}
                              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #dcd4cb', fontSize: '12px' }}
                            >
                              <option value="Aktif">Aktif</option>
                              <option value="Nonaktif">Nonaktif</option>
                            </select>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                className="btn-restock-small"
                                style={{ backgroundColor: '#10b981' }}
                                disabled={savingEdit}
                                onClick={handleSaveEdit}
                              >
                                {savingEdit ? '...' : 'Simpan'}
                              </button>
                              <button
                                type="button"
                                className="btn-restock-small"
                                style={{ backgroundColor: '#ef4444' }}
                                disabled={savingEdit}
                                onClick={() => setEditingId(null)}
                              >
                                Batal
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <strong>{item.name}</strong>
                            <div style={{ fontSize: '11px', color: '#7a6d64' }}>
                              {item.code}{item.active === false ? ' • Nonaktif' : ''}
                            </div>
                          </td>
                          <td>
                            <strong>{formatQuantity(item.available_quantity)}</strong> {item.unit}
                            {Number(item.reserved_quantity) > 0 && (
                              <div style={{ color: '#9a3412', fontSize: '11px' }}>
                                Aktual: {formatQuantity(item.actual_quantity)} (-{formatQuantity(item.reserved_quantity)} reserved)
                              </div>
                            )}
                          </td>
                          <td>{formatQuantity(item.minimum_stock)} {item.unit}</td>
                          <td>
                            <span className={`status ${!item.active || item.low_stock ? 'low' : 'safe'}`}>
                              {!item.active ? 'Nonaktif' : (item.low_stock ? 'Menipis' : 'Aman')}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-restock-small"
                              onClick={() => handleStartEdit(item)}
                            >
                              Edit
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="recipe-panel">
            <h3>Resep &amp; Potong Stok Per Porsi</h3>
            <p className="subtitle">Pengurangan stok terjadi otomatis melalui transaksi pembayaran di Kasir. Atur detail resep di halaman Menu.</p>

            {products.length === 0 ? (
              <p style={{ color: '#7a6d64', fontSize: '14px' }}>Belum ada produk aktif.</p>
            ) : (
              products.map((product) => (
                <div key={product.id} className="recipe-card">
                  <h4>{product.name}</h4>
                  <p>
                    • Status Resep{' '}
                    <span>
                      {product.active_recipe
                        ? `Aktif (v${product.active_recipe.version})`
                        : 'Belum diatur'}
                    </span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        stocks={stocks}
        onSave={handleRestockSave}
      />
    </div>
  );
}
