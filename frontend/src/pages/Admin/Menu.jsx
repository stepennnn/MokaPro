import { useCallback, useEffect, useState } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import { apiFetch } from '../../lib/api';
import './Menu.css';

function toDecimalString(value, decimals = 2) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return null;
  }
  return num.toFixed(decimals);
}

const MODIFIER_TYPES = [
  { value: 'choice', label: 'Pilihan (choice)' },
  { value: 'boolean', label: 'Ya / Tidak (boolean)' },
  { value: 'text', label: 'Teks Bebas (text)' },
];

export default function Menu() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'modifiers'

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Product edit/create state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    category_id: '',
    price: '',
    active: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: '',
    name: '',
    category_id: '',
    price: '',
    active: true,
  });
  const [creating, setCreating] = useState(false);

  // Recipe Modal state
  const [recipeModalProduct, setRecipeModalProduct] = useState(null);
  const [recipeRows, setRecipeRows] = useState([]);
  const [recipeVersion, setRecipeVersion] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [recipeError, setRecipeError] = useState('');

  // Assign Modifiers to Product Modal state
  const [modifierModalProduct, setModifierModalProduct] = useState(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState([]);
  const [savingProductModifiers, setSavingProductModifiers] = useState(false);
  const [productModifierError, setProductModifierError] = useState('');

  // Modifier CRUD state
  const [showCreateModifierForm, setShowCreateModifierForm] = useState(false);
  const [createModifierForm, setCreateModifierForm] = useState({
    code: '',
    name: '',
    type: 'choice',
    value: '',
    active: true,
  });
  const [creatingModifier, setCreatingModifier] = useState(false);

  const [editingModifierId, setEditingModifierId] = useState(null);
  const [editModifierForm, setEditModifierForm] = useState({
    code: '',
    name: '',
    type: 'choice',
    value: '',
    active: true,
  });
  const [savingModifierEdit, setSavingModifierEdit] = useState(false);

  const fetchMenuData = useCallback(async () => {
    const [productsRes, categoriesRes, ingredientsRes, modifiersRes] = await Promise.all([
      apiFetch('/api/products?include_inactive=1'),
      apiFetch('/api/categories'),
      apiFetch('/api/admin/ingredients'),
      apiFetch('/api/admin/modifiers'),
    ]);

    const [productsPayload, categoriesPayload, ingredientsPayload, modifiersPayload] = await Promise.all([
      productsRes.json(),
      categoriesRes.json(),
      ingredientsRes.json(),
      modifiersRes.json(),
    ]);

    return {
      products: Array.isArray(productsPayload.data) ? productsPayload.data : [],
      categories: Array.isArray(categoriesPayload.data) ? categoriesPayload.data : [],
      ingredients: Array.isArray(ingredientsPayload.data) ? ingredientsPayload.data : [],
      modifiers: Array.isArray(modifiersPayload.data) ? modifiersPayload.data : [],
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchMenuData()
      .then((result) => {
        if (!cancelled) {
          setProducts(result.products);
          setCategories(result.categories);
          setIngredients(result.ingredients);
          setModifiers(result.modifiers);
          setCreateForm((prev) => ({
            ...prev,
            category_id: prev.category_id || (result.categories[0] ? String(result.categories[0].id) : ''),
          }));
          setError('');
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || 'Gagal memuat daftar menu, bahan baku, dan modifier.');
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
  }, [fetchMenuData]);

  // --- PRODUCT HANDLERS ---
  const handleEditClick = (product) => {
    setFeedback('');
    setError('');
    setEditingId(product.id);
    setEditForm({
      code: product.code || '',
      name: product.name || '',
      category_id: product.category?.id ? String(product.category.id) : '',
      price: String(Number(product.price || 0)),
      active: Boolean(product.active),
    });
  };

  const handleSaveEdit = async () => {
    const decimalPrice = toDecimalString(editForm.price, 2);
    if (!editForm.code.trim() || !editForm.name.trim() || !editForm.category_id || decimalPrice === null) {
      setError('Pastikan kode, nama, kategori, dan harga valid.');
      return;
    }

    setSavingEdit(true);
    setError('');
    setFeedback('');

    try {
      const response = await apiFetch(`/api/admin/products/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          code: editForm.code.trim(),
          name: editForm.name.trim(),
          category_id: Number(editForm.category_id),
          price: decimalPrice,
          active: Boolean(editForm.active),
        }),
      });

      const payload = await response.json();
      const updated = payload.data;

      setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      setEditingId(null);
      setFeedback('Menu berhasil diperbarui!');
    } catch (requestError) {
      setError(requestError.message || 'Gagal menyimpan perubahan menu.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const decimalPrice = toDecimalString(createForm.price, 2);

    if (!createForm.code.trim() || !createForm.name.trim() || !createForm.category_id || decimalPrice === null) {
      setError('Lengkapi kode SKU, nama produk, kategori, dan harga yang valid.');
      return;
    }

    setCreating(true);
    setError('');
    setFeedback('');

    try {
      const response = await apiFetch('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          code: createForm.code.trim(),
          name: createForm.name.trim(),
          category_id: Number(createForm.category_id),
          price: decimalPrice,
          active: Boolean(createForm.active),
        }),
      });

      const payload = await response.json();
      const created = payload.data;

      setProducts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setCreateForm({
        code: '',
        name: '',
        category_id: categories[0] ? String(categories[0].id) : '',
        price: '',
        active: true,
      });
      setShowCreateForm(false);
      setFeedback('Produk baru berhasil ditambahkan!');
    } catch (requestError) {
      setError(requestError.message || 'Gagal menambahkan produk baru.');
    } finally {
      setCreating(false);
    }
  };

  // --- RECIPE MODAL HANDLERS ---
  const handleOpenRecipeModal = async (product) => {
    setRecipeModalProduct(product);
    setRecipeError('');
    setRecipeRows([]);
    setRecipeVersion(product.active_recipe?.version || null);
    setLoadingRecipe(true);

    try {
      const response = await apiFetch(`/api/admin/products/${product.id}/recipe`);
      const payload = await response.json();
      const recipe = payload.data;

      if (recipe && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
        setRecipeVersion(recipe.version);
        setRecipeRows(
          recipe.ingredients.map((item) => ({
            ingredient_id: String(item.ingredient_id),
            quantity: String(Number(item.quantity)),
          })),
        );
      } else {
        setRecipeRows([
          {
            ingredient_id: ingredients[0] ? String(ingredients[0].id) : '',
            quantity: '',
          },
        ]);
      }
    } catch (requestError) {
      setRecipeError(requestError.message || 'Gagal memuat resep aktif produk.');
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleAddRecipeRow = () => {
    const usedIds = new Set(recipeRows.map((row) => row.ingredient_id));
    const availableIngredient = ingredients.find((ing) => !usedIds.has(String(ing.id)));
    setRecipeRows((prev) => [
      ...prev,
      {
        ingredient_id: availableIngredient ? String(availableIngredient.id) : '',
        quantity: '',
      },
    ]);
  };

  const handleUpdateRecipeRow = (index, field, value) => {
    setRecipeRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)));
  };

  const handleRemoveRecipeRow = (index) => {
    setRecipeRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    if (!recipeModalProduct) return;

    if (recipeRows.length === 0) {
      setRecipeError('Minimal harus ada 1 bahan baku dalam resep.');
      return;
    }

    const formattedIngredients = [];
    const seenIds = new Set();

    for (const row of recipeRows) {
      const ingredientId = Number(row.ingredient_id);
      const qtyNum = Number(row.quantity);
      if (!ingredientId || !Number.isFinite(qtyNum) || qtyNum <= 0) {
        setRecipeError('Setiap baris harus memilih bahan baku dan takaran lebih dari 0.');
        return;
      }
      if (seenIds.has(ingredientId)) {
        setRecipeError('Bahan baku tidak boleh duplikat di dalam resep yang sama.');
        return;
      }
      seenIds.add(ingredientId);
      formattedIngredients.push({
        ingredient_id: ingredientId,
        quantity: qtyNum.toFixed(3),
      });
    }

    setSavingRecipe(true);
    setRecipeError('');

    try {
      const response = await apiFetch(`/api/admin/products/${recipeModalProduct.id}/recipes`, {
        method: 'POST',
        body: JSON.stringify({ ingredients: formattedIngredients }),
      });

      const payload = await response.json();
      const savedRecipe = payload.data;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === recipeModalProduct.id
            ? { ...p, active_recipe: { id: savedRecipe.id, version: savedRecipe.version } }
            : p,
        ),
      );
      setFeedback(`Resep ${recipeModalProduct.name} berhasil disimpan (versi v${savedRecipe.version}).`);
      setRecipeModalProduct(null);
    } catch (requestError) {
      setRecipeError(requestError.message || 'Gagal menyimpan resep produk.');
    } finally {
      setSavingRecipe(false);
    }
  };

  // --- ASSIGN MODIFIERS MODAL HANDLERS ---
  const handleOpenProductModifierModal = (product) => {
    setModifierModalProduct(product);
    setProductModifierError('');
    setSelectedModifierIds(
      Array.isArray(product.modifiers) ? product.modifiers.map((m) => Number(m.id)) : [],
    );
  };

  const handleToggleProductModifier = (modifierId) => {
    setSelectedModifierIds((prev) =>
      prev.includes(modifierId) ? prev.filter((id) => id !== modifierId) : [...prev, modifierId],
    );
  };

  const handleSaveProductModifiers = async (e) => {
    e.preventDefault();
    if (!modifierModalProduct) return;

    setSavingProductModifiers(true);
    setProductModifierError('');

    try {
      const response = await apiFetch(`/api/admin/products/${modifierModalProduct.id}/modifiers`, {
        method: 'PUT',
        body: JSON.stringify({ modifier_ids: selectedModifierIds }),
      });

      const payload = await response.json();
      const updatedModifiers = Array.isArray(payload.data) ? payload.data : [];

      setProducts((prev) =>
        prev.map((p) =>
          p.id === modifierModalProduct.id ? { ...p, modifiers: updatedModifiers } : p,
        ),
      );
      setFeedback(`Modifier untuk ${modifierModalProduct.name} berhasil diperbarui.`);
      setModifierModalProduct(null);
    } catch (requestError) {
      setProductModifierError(requestError.message || 'Gagal menautkan modifier ke produk.');
    } finally {
      setSavingProductModifiers(false);
    }
  };

  // --- MODIFIER CRUD HANDLERS ---
  const handleCreateModifier = async (e) => {
    e.preventDefault();
    if (!createModifierForm.code.trim() || !createModifierForm.name.trim() || !createModifierForm.value.trim()) {
      setError('Kode, nama, tipe, dan nilai modifier wajib diisi.');
      return;
    }

    setCreatingModifier(true);
    setError('');
    setFeedback('');

    try {
      const response = await apiFetch('/api/admin/modifiers', {
        method: 'POST',
        body: JSON.stringify({
          code: createModifierForm.code.trim(),
          name: createModifierForm.name.trim(),
          type: createModifierForm.type,
          value: createModifierForm.value.trim(),
          active: Boolean(createModifierForm.active),
        }),
      });

      const payload = await response.json();
      const created = payload.data;

      setModifiers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setCreateModifierForm({
        code: '',
        name: '',
        type: 'choice',
        value: '',
        active: true,
      });
      setShowCreateModifierForm(false);
      setFeedback('Modifier baru berhasil ditambahkan.');
    } catch (requestError) {
      setError(requestError.message || 'Gagal menambahkan modifier.');
    } finally {
      setCreatingModifier(false);
    }
  };

  const handleStartEditModifier = (modifier) => {
    setError('');
    setFeedback('');
    setEditingModifierId(modifier.id);
    setEditModifierForm({
      code: modifier.code || '',
      name: modifier.name || '',
      type: modifier.type || 'choice',
      value: modifier.value || '',
      active: Boolean(modifier.active),
    });
  };

  const handleSaveModifierEdit = async () => {
    if (!editModifierForm.code.trim() || !editModifierForm.name.trim() || !editModifierForm.value.trim()) {
      setError('Kode, nama, tipe, dan nilai modifier wajib diisi.');
      return;
    }

    setSavingModifierEdit(true);
    setError('');
    setFeedback('');

    try {
      const response = await apiFetch(`/api/admin/modifiers/${editingModifierId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          code: editModifierForm.code.trim(),
          name: editModifierForm.name.trim(),
          type: editModifierForm.type,
          value: editModifierForm.value.trim(),
          active: Boolean(editModifierForm.active),
        }),
      });

      const payload = await response.json();
      const updated = payload.data;

      setModifiers((prev) => prev.map((m) => (m.id === editingModifierId ? updated : m)));
      // Keep product modifier badges aligned if a modifier was edited or deactivated
      setProducts((prev) =>
        prev.map((product) => ({
          ...product,
          modifiers: (product.modifiers || [])
            .map((m) => (m.id === updated.id ? updated : m))
            .filter((m) => m.active !== false),
        })),
      );
      setEditingModifierId(null);
      setFeedback('Modifier berhasil diperbarui.');
    } catch (requestError) {
      setError(requestError.message || 'Gagal memperbarui modifier.');
    } finally {
      setSavingModifierEdit(false);
    }
  };

  const activeModifiers = modifiers.filter((m) => m.active);

  return (
    <div className="menu-page">
      <DashboardNavbar />
      <main className="menu-main">
        <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">Kelola Menu, Resep &amp; Modifier</h1>
            <p className="page-subtitle">Perubahan di sini tersimpan ke database dan langsung terlihat di halaman Kasir.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={activeTab === 'products' ? 'btn-edit' : 'btn-secondary-tab'}
              onClick={() => {
                setActiveTab('products');
                setError('');
              }}
            >
              Produk &amp; Resep ({products.length})
            </button>
            <button
              type="button"
              className={activeTab === 'modifiers' ? 'btn-edit' : 'btn-secondary-tab'}
              onClick={() => {
                setActiveTab('modifiers');
                setError('');
              }}
            >
              Kelola Modifier ({modifiers.length})
            </button>
            {activeTab === 'products' ? (
              <button
                type="button"
                className="btn-save"
                onClick={() => {
                  setShowCreateForm((prev) => !prev);
                  setError('');
                  setFeedback('');
                }}
              >
                {showCreateForm ? 'Tutup Form' : '+ Tambah Produk'}
              </button>
            ) : (
              <button
                type="button"
                className="btn-save"
                onClick={() => {
                  setShowCreateModifierForm((prev) => !prev);
                  setError('');
                  setFeedback('');
                }}
              >
                {showCreateModifierForm ? 'Tutup Form' : '+ Tambah Modifier'}
              </button>
            )}
          </div>
        </div>

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

        {activeTab === 'products' && (
          <>
            {showCreateForm && (
              <div className="table-card" style={{ marginBottom: '20px', padding: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '14px' }}>Tambah Produk Baru</h3>
                <form onSubmit={handleCreateProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Kode SKU</label>
                    <input
                      type="text"
                      className="edit-input"
                      value={createForm.code}
                      onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                      placeholder="Contoh: MENU-LATTE-01"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Nama Produk</label>
                    <input
                      type="text"
                      className="edit-input"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Nama menu"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Kategori</label>
                    <select
                      className="edit-input"
                      value={createForm.category_id}
                      onChange={(e) => setCreateForm({ ...createForm, category_id: e.target.value })}
                      required
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Harga (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="edit-input"
                      value={createForm.price}
                      onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                      placeholder="25000"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Status</label>
                    <select
                      className="edit-input"
                      value={createForm.active ? 'Aktif' : 'Nonaktif'}
                      onChange={(e) => setCreateForm({ ...createForm, active: e.target.value === 'Aktif' })}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                  <div>
                    <button type="submit" className="btn-save" disabled={creating}>
                      {creating ? 'Menyimpan...' : 'Simpan Produk'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="table-card">
              {loading ? (
                <p role="status" style={{ padding: '24px', textAlign: 'center', color: '#7a6d64' }}>
                  Memuat data menu...
                </p>
              ) : products.length === 0 ? (
                <p style={{ padding: '24px', textAlign: 'center', color: '#7a6d64' }}>
                  Belum ada produk terdaftar.
                </p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Kategori</th>
                      <th>Harga</th>
                      <th>Resep / Modifier</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        {editingId === product.id ? (
                          <>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <input
                                  type="text"
                                  value={editForm.code}
                                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                  className="edit-input"
                                  placeholder="Kode SKU"
                                />
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="edit-input"
                                  placeholder="Nama produk"
                                />
                              </div>
                            </td>
                            <td>
                              <select
                                value={editForm.category_id}
                                onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                                className="edit-input"
                              >
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                className="edit-input"
                              />
                            </td>
                            <td style={{ color: '#7a6d64', fontSize: '12px' }}>-</td>
                            <td>
                              <select
                                value={editForm.active ? 'Aktif' : 'Nonaktif'}
                                onChange={(e) => setEditForm({ ...editForm, active: e.target.value === 'Aktif' })}
                                className="edit-input"
                              >
                                <option value="Aktif">Aktif</option>
                                <option value="Nonaktif">Nonaktif</option>
                              </select>
                            </td>
                            <td>
                              <button type="button" onClick={handleSaveEdit} className="btn-save" disabled={savingEdit}>
                                {savingEdit ? 'Menyimpan...' : 'Simpan'}
                              </button>
                              <button type="button" onClick={() => setEditingId(null)} className="btn-cancel" disabled={savingEdit}>
                                Batal
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <strong>{product.name}</strong>
                              <div style={{ fontSize: '11px', color: '#7a6d64' }}><code>{product.code}</code></div>
                            </td>
                            <td>{product.category?.name || '-'}</td>
                            <td>Rp {Number(product.price || 0).toLocaleString('id-ID')}</td>
                            <td>
                              <div style={{ fontSize: '12px', color: '#5c4b40' }}>
                                Resep: <strong>{product.active_recipe ? `v${product.active_recipe.version}` : 'Belum'}</strong>
                              </div>
                              <div style={{ fontSize: '12px', color: '#7a6d64' }}>
                                Modifier: {Array.isArray(product.modifiers) ? product.modifiers.length : 0} aktif
                              </div>
                            </td>
                            <td>
                              <span className={`status ${product.active ? 'safe' : 'low'}`}>
                                {product.active ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => handleEditClick(product)} className="btn-edit">
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRecipeModal(product)}
                                  className="btn-secondary-action"
                                >
                                  Resep
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenProductModifierModal(product)}
                                  className="btn-secondary-action"
                                >
                                  Modifier
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {activeTab === 'modifiers' && (
          <>
            {showCreateModifierForm && (
              <div className="table-card" style={{ marginBottom: '20px', padding: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '14px' }}>Tambah Modifier Baru</h3>
                <form onSubmit={handleCreateModifier} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Kode</label>
                    <input
                      type="text"
                      className="edit-input"
                      value={createModifierForm.code}
                      onChange={(e) => setCreateModifierForm({ ...createModifierForm, code: e.target.value })}
                      placeholder="Contoh: ICE-LEVEL"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Nama Modifier</label>
                    <input
                      type="text"
                      className="edit-input"
                      value={createModifierForm.name}
                      onChange={(e) => setCreateModifierForm({ ...createModifierForm, name: e.target.value })}
                      placeholder="Opsi Es"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Tipe</label>
                    <select
                      className="edit-input"
                      value={createModifierForm.type}
                      onChange={(e) => setCreateModifierForm({ ...createModifierForm, type: e.target.value })}
                    >
                      {MODIFIER_TYPES.map((typeOption) => (
                        <option key={typeOption.value} value={typeOption.value}>{typeOption.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Nilai / Opsi</label>
                    <input
                      type="text"
                      className="edit-input"
                      value={createModifierForm.value}
                      onChange={(e) => setCreateModifierForm({ ...createModifierForm, value: e.target.value })}
                      placeholder="Normal, Less Ice, No Ice"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Status</label>
                    <select
                      className="edit-input"
                      value={createModifierForm.active ? 'Aktif' : 'Nonaktif'}
                      onChange={(e) => setCreateModifierForm({ ...createModifierForm, active: e.target.value === 'Aktif' })}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                  <div>
                    <button type="submit" className="btn-save" disabled={creatingModifier}>
                      {creatingModifier ? 'Menyimpan...' : 'Simpan Modifier'}
                    </button>
                  </div>
                </form>
                <p style={{ marginTop: '10px', marginBottom: 0, fontSize: '12px', color: '#7a6d64' }}>
                  Tip: Untuk tipe <code>choice</code>, pisahkan pilihan dengan koma (contoh: <code>Es Normal, Sedikit Es, Tanpa Es</code>).
                </p>
              </div>
            )}

            <div className="table-card">
              {loading ? (
                <p role="status" style={{ padding: '24px', textAlign: 'center', color: '#7a6d64' }}>
                  Memuat daftar modifier...
                </p>
              ) : modifiers.length === 0 ? (
                <p style={{ padding: '24px', textAlign: 'center', color: '#7a6d64' }}>
                  Belum ada modifier terdaftar. Klik &quot;+ Tambah Modifier&quot; untuk menambahkan.
                </p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Nama</th>
                      <th>Tipe</th>
                      <th>Nilai / Opsi</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modifiers.map((modifier) => (
                      <tr key={modifier.id}>
                        {editingModifierId === modifier.id ? (
                          <>
                            <td>
                              <input
                                type="text"
                                className="edit-input"
                                value={editModifierForm.code}
                                onChange={(e) => setEditModifierForm({ ...editModifierForm, code: e.target.value })}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="edit-input"
                                value={editModifierForm.name}
                                onChange={(e) => setEditModifierForm({ ...editModifierForm, name: e.target.value })}
                              />
                            </td>
                            <td>
                              <select
                                className="edit-input"
                                value={editModifierForm.type}
                                onChange={(e) => setEditModifierForm({ ...editModifierForm, type: e.target.value })}
                              >
                                {MODIFIER_TYPES.map((typeOption) => (
                                  <option key={typeOption.value} value={typeOption.value}>{typeOption.label}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="edit-input"
                                value={editModifierForm.value}
                                onChange={(e) => setEditModifierForm({ ...editModifierForm, value: e.target.value })}
                              />
                            </td>
                            <td>
                              <select
                                className="edit-input"
                                value={editModifierForm.active ? 'Aktif' : 'Nonaktif'}
                                onChange={(e) => setEditModifierForm({ ...editModifierForm, active: e.target.value === 'Aktif' })}
                              >
                                <option value="Aktif">Aktif</option>
                                <option value="Nonaktif">Nonaktif</option>
                              </select>
                            </td>
                            <td>
                              <button type="button" onClick={handleSaveModifierEdit} className="btn-save" disabled={savingModifierEdit}>
                                {savingModifierEdit ? 'Menyimpan...' : 'Simpan'}
                              </button>
                              <button type="button" onClick={() => setEditingModifierId(null)} className="btn-cancel" disabled={savingModifierEdit}>
                                Batal
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td><code>{modifier.code}</code></td>
                            <td><strong>{modifier.name}</strong></td>
                            <td>{modifier.type}</td>
                            <td>{modifier.value}</td>
                            <td>
                              <span className={`status ${modifier.active ? 'safe' : 'low'}`}>
                                {modifier.active ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </td>
                            <td>
                              <button type="button" onClick={() => handleStartEditModifier(modifier)} className="btn-edit">
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
          </>
        )}
      </main>

      {/* MODAL KELOLA RESEP PRODUK */}
      {recipeModalProduct && (
        <div
          className="admin-modal-overlay"
          onClick={() => !savingRecipe && setRecipeModalProduct(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '18px' }}>Kelola Resep: {recipeModalProduct.name}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7a6d64' }}>
                  {recipeVersion ? `Versi aktif saat ini: v${recipeVersion}. Menyimpan akan membuat versi resep baru.` : 'Belum ada resep aktif. Tambahkan komposisi bahan per porsi.'}
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                disabled={savingRecipe}
                onClick={() => setRecipeModalProduct(null)}
              >
                ×
              </button>
            </div>

            {loadingRecipe ? (
              <p role="status" style={{ padding: '20px 0', color: '#7a6d64' }}>Memuat resep aktif...</p>
            ) : ingredients.length === 0 ? (
              <p style={{ padding: '20px 0', color: '#9a3412', fontSize: '14px' }}>
                Belum ada bahan baku aktif. Tambahkan bahan baku terlebih dahulu di halaman Inventaris.
              </p>
            ) : (
              <form onSubmit={handleSaveRecipe}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {recipeRows.map((row, index) => {
                    const selectedIngredient = ingredients.find((ing) => String(ing.id) === String(row.ingredient_id));
                    return (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 130px auto', gap: '8px', alignItems: 'center' }}>
                        <select
                          className="edit-input"
                          value={row.ingredient_id}
                          onChange={(e) => handleUpdateRecipeRow(index, 'ingredient_id', e.target.value)}
                          required
                        >
                          <option value="">-- Pilih Bahan Baku --</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            className="edit-input"
                            value={row.quantity}
                            onChange={(e) => handleUpdateRecipeRow(index, 'quantity', e.target.value)}
                            placeholder="Takaran"
                            required
                          />
                          <span style={{ fontSize: '12px', color: '#7a6d64', minWidth: '24px' }}>
                            {selectedIngredient?.unit || ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-cancel"
                          disabled={recipeRows.length <= 1 || savingRecipe}
                          onClick={() => handleRemoveRecipeRow(index)}
                        >
                          Hapus
                        </button>
                      </div>
                    );
                  })}
                </div>

                {recipeError && (
                  <p role="alert" style={{ color: '#b91c1c', fontSize: '13px', marginBottom: '12px' }}>
                    {recipeError}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary-action"
                    onClick={handleAddRecipeRow}
                    disabled={savingRecipe || recipeRows.length >= ingredients.length}
                  >
                    + Tambah Baris Bahan
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-cancel"
                      disabled={savingRecipe}
                      onClick={() => setRecipeModalProduct(null)}
                    >
                      Batal
                    </button>
                    <button type="submit" className="btn-save" disabled={savingRecipe}>
                      {savingRecipe ? 'Menyimpan...' : 'Simpan Resep'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL TAUTKAN MODIFIER KE PRODUK */}
      {modifierModalProduct && (
        <div
          className="admin-modal-overlay"
          onClick={() => !savingProductModifiers && setModifierModalProduct(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '18px' }}>Modifier Produk: {modifierModalProduct.name}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7a6d64' }}>
                  Pilih modifier aktif yang akan muncul di Kasir saat produk ini dipilih.
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                disabled={savingProductModifiers}
                onClick={() => setModifierModalProduct(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveProductModifiers}>
              {activeModifiers.length === 0 ? (
                <p style={{ padding: '16px 0', color: '#7a6d64', fontSize: '14px' }}>
                  Belum ada modifier aktif. Tambahkan modifier di tab &quot;Kelola Modifier&quot; terlebih dahulu.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                  {activeModifiers.map((mod) => {
                    const checked = selectedModifierIds.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${checked ? '#3b2519' : '#ede5dc'}`,
                          backgroundColor: checked ? '#faf4ec' : '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleProductModifier(mod.id)}
                        />
                        <div>
                          <strong style={{ fontSize: '14px', color: '#261a15' }}>{mod.name}</strong>
                          <div style={{ fontSize: '12px', color: '#7a6d64' }}>
                            {mod.type} • {mod.value}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {productModifierError && (
                <p role="alert" style={{ color: '#b91c1c', fontSize: '13px', marginBottom: '12px' }}>
                  {productModifierError}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-cancel"
                  disabled={savingProductModifiers}
                  onClick={() => setModifierModalProduct(null)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-save" disabled={savingProductModifiers}>
                  {savingProductModifiers ? 'Menyimpan...' : 'Simpan Tautan Modifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
