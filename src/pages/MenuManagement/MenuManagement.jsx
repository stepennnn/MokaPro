import { useState } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import './MenuManagement.css';

// Master data daftar menu sesuai referensi visual kelola menu.png
const INITIAL_MENU_ITEMS = [
  {
    id: 1,
    name: 'Espresso Double',
    category: 'Espresso Based',
    price: 22000,
    status: 'Aktif'
  },
  {
    id: 2,
    name: 'Caffe Latte',
    category: 'Espresso Based',
    price: 28000,
    status: 'Aktif'
  },
  {
    id: 3,
    name: 'Kopi Susu Gula Aren',
    category: 'Espresso Based',
    price: 25000,
    status: 'Aktif'
  },
  {
    id: 4,
    name: 'Matcha Latte',
    category: 'Non-Coffee',
    price: 30000,
    status: 'Aktif'
  },
  {
    id: 5,
    name: 'V60 Single Origin',
    category: 'Manual Brew',
    price: 32000,
    status: 'Aktif'
  },
  {
    id: 6,
    name: 'Butter Croissant',
    category: 'Pastry & Food',
    price: 24000,
    status: 'Aktif'
  }
];

/**
 * MenuManagement Page Component
 * Route: /admin/menu & /menu
 * Halaman administrasi daftar produk dan resep untuk role Admin / Pengelola
 */
export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState(INITIAL_MENU_ITEMS);

  const formatRupiah = (val) =>
    `Rp ${Number(val).toLocaleString('id-ID')}`;

  // Toggle status menu (Aktif / Nonaktif) dengan state lokal
  const handleToggleStatus = (id) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'Aktif' ? 'Nonaktif' : 'Aktif' }
          : item
      )
    );
  };

  return (
    <div className="menu-management-page">
      {/* Dashboard Navbar Role Admin / Pengelola */}
      <DashboardNavbar
        role="admin"
        storeName="Cabang Utama Toko"
        userName="Pengelola 01"
        userRoleLabel="Admin / Pengelola"
      />

      {/* Main Content Area */}
      <main className="menu-management-main">
        <div className="menu-management-container">
          {/* Header Title Section */}
          <header className="menu-management-header">
            <h1 className="menu-management-title">
              Kelola Menu &amp; Resep
            </h1>
            <p className="menu-management-subtitle">
              Contoh tampilan administrasi produk. Simulasi frontend, bukan database nyata.
            </p>
          </header>

          {/* Menu Table Card */}
          <section className="menu-management-card" aria-label="Tabel Administrasi Produk">
            <div className="menu-table-wrap">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th scope="col" className="col-product">Produk</th>
                    <th scope="col" className="col-category">Kategori</th>
                    <th scope="col" className="col-price">Harga</th>
                    <th scope="col" className="col-status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item) => (
                    <tr key={item.id} className="menu-table-row">
                      <td className="cell-product">{item.name}</td>
                      <td className="cell-category">{item.category}</td>
                      <td className="cell-price">{formatRupiah(item.price)}</td>
                      <td className="cell-status">
                        <button
                          type="button"
                          className={`menu-status-pill ${
                            item.status === 'Aktif'
                              ? 'menu-status-pill--active'
                              : 'menu-status-pill--inactive'
                          }`}
                          onClick={() => handleToggleStatus(item.id)}
                          title="Klik untuk mengubah status produk"
                        >
                          {item.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SRS Footnote / Info Notice */}
            <div className="menu-management-note">
              Penambahan dan perubahan produk akan dikembangkan oleh tim frontend/backend sesuai SRS.
            </div>
          </section>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="menu-management-footer">
        <div className="menu-management-footer-container">
          <p className="menu-management-footer-copy">
            &copy; 2026 Moka Pro POS &amp; Roastery OS. Dirancang untuk operasional kopi spesialitas.
          </p>

          <div className="menu-management-footer-status">
            <div className="status-indicator">
              <span className="status-dot" aria-hidden="true"></span>
              <span className="status-text">Cloud Tersinkronisasi</span>
            </div>
            <span className="status-separator" aria-hidden="true">&bull;</span>
            <span className="terminal-id">Terminal #01</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
