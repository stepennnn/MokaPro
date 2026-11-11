import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import './Menu.css';

// Data Awal
const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Espresso Double', category: 'Espresso Based', price: 22000, status: 'Aktif' },
  { id: 2, name: 'Caffe Latte', category: 'Espresso Based', price: 28000, status: 'Aktif' },
  { id: 3, name: 'Kopi Susu Gula Aren', category: 'Espresso Based', price: 25000, status: 'Aktif' },
  { id: 4, name: 'Matcha Latte', category: 'Non-Coffee', price: 30000, status: 'Aktif' },
  { id: 5, name: 'V60 Single Origin', category: 'Manual Brew', price: 32000, status: 'Aktif' },
  { id: 6, name: 'Butter Croissant', category: 'Pastry & Food', price: 24000, status: 'Aktif' },
];

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', price: '', status: 'Aktif' });

  // Load data
  useEffect(() => {
    const savedProducts = JSON.parse(localStorage.getItem('mokapro_products'));
    if (savedProducts) setProducts(savedProducts);
    else {
      setProducts(DEFAULT_PRODUCTS);
      localStorage.setItem('mokapro_products', JSON.stringify(DEFAULT_PRODUCTS));
    }
  }, []);

  // Buka mode edit
  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  // Simpan perubahan
  const handleSaveEdit = () => {
    const updatedProducts = products.map(p => 
      p.id === editingId ? { ...p, ...editForm, price: parseInt(editForm.price) } : p
    );
    setProducts(updatedProducts);
    localStorage.setItem('mokapro_products', JSON.stringify(updatedProducts));
    setEditingId(null);
    alert('Menu berhasil diperbarui!');
  };

  return (
    <div className="menu-page">
      <DashboardNavbar role="admin" userName="Pengelola 01" userRoleLabel="Admin" />
      <main className="menu-main">
        <div className="header-section">
          <h1 className="page-title">Kelola Menu & Resep</h1>
          <p className="page-subtitle">Perubahan di sini akan langsung terlihat di halaman Kasir.</p>
        </div>

        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  {editingId === product.id ? (
                    // Mode Edit
                    <>
                      <td><input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="edit-input" /></td>
                      <td><input type="text" value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} className="edit-input" /></td>
                      <td><input type="number" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: e.target.value})} className="edit-input" /></td>
                      <td>
                        <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="edit-input">
                          <option value="Aktif">Aktif</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                      </td>
                      <td>
                        <button onClick={handleSaveEdit} className="btn-save">Simpan</button>
                        <button onClick={() => setEditingId(null)} className="btn-cancel">Batal</button>
                      </td>
                    </>
                  ) : (
                    // Mode Tampil
                    <>
                      <td><strong>{product.name}</strong></td>
                      <td>{product.category}</td>
                      <td>Rp {product.price.toLocaleString('id-ID')}</td>
                      <td><span className={`status ${product.status === 'Aktif' ? 'safe' : 'low'}`}>{product.status}</span></td>
                      <td>
                        <button onClick={() => handleEditClick(product)} className="btn-edit">Edit</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}