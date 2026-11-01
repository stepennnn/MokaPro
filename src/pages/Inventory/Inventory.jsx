import { useState } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import RestockModal from '../../components/RestockModal/RestockModal';
import './Inventory.css';

// Master data bahan raw sesuai referensi visual stok.png
const INITIAL_INVENTORY = [
  {
    id: 1,
    name: 'Biji Kopi Houseblend (Arabica)',
    currentStock: '2.400 g',
    minStock: '500 g',
    status: 'Aman'
  },
  {
    id: 2,
    name: 'Susu Fresh Milk (UHT)',
    currentStock: '8.500 ml',
    minStock: '2.000 ml',
    status: 'Aman'
  },
  {
    id: 3,
    name: 'Sirup Gula Aren Organik',
    currentStock: '450 ml',
    minStock: '500 ml',
    status: 'Menipis'
  },
  {
    id: 4,
    name: 'Bubuk Matcha Premium',
    currentStock: '800 g',
    minStock: '200 g',
    status: 'Aman'
  },
  {
    id: 5,
    name: 'Croissant Frozen Stock',
    currentStock: '12 pcs',
    minStock: '15 pcs',
    status: 'Menipis'
  }
];

// Data panduan resep & porsi
const RECIPES_DATA = [
  {
    id: 1,
    name: 'Espresso Double',
    ingredients: 'Biji Kopi Houseblend -18 g'
  },
  {
    id: 2,
    name: 'Caffe Latte',
    ingredients: 'Biji Kopi -18 g · Susu -150 ml'
  },
  {
    id: 3,
    name: 'Kopi Susu Gula Aren',
    ingredients: 'Biji Kopi -18 g · Susu -120 ml · Gula Aren -20 ml'
  }
];

// Helper untuk mem-parsing format stok teks (misal: "2.400 g", "450 ml")
function parseStock(str) {
  const match = str.match(/^([\d.,]+)\s*([a-zA-Z]+)$/);
  if (!match) return { amount: 0, unit: '' };
  const numStr = match[1].replace(/\./g, '');
  return {
    amount: parseFloat(numStr) || 0,
    unit: match[2]
  };
}

// Helper untuk memformat angka stok kembali ke teks (misal: 2500, "g" -> "2.500 g")
function formatStock(amount, unit) {
  const formatted = Math.round(amount).toLocaleString('id-ID');
  return `${formatted} ${unit}`;
}

/**
 * Inventory Page Component
 * Route: /admin/inventory
 * Halaman pemantauan inventaris bahan mentah untuk role Admin/Pengelola
 */
export default function Inventory() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);

  // Hitung jumlah bahan menipis secara dinamis
  const lowStockCount = inventory.filter((item) => item.status === 'Menipis').length;

  const handleOpenRestock = () => {
    setIsRestockModalOpen(true);
  };

  const handleConfirmRestock = ({ itemId, additionalAmount }) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const { amount: current, unit } = parseStock(item.currentStock);
          const { amount: min } = parseStock(item.minStock);
          const newAmount = current + additionalAmount;
          const newStatus = newAmount >= min ? 'Aman' : 'Menipis';
          return {
            ...item,
            currentStock: formatStock(newAmount, unit),
            status: newStatus
          };
        }
        return item;
      })
    );
    setIsRestockModalOpen(false);
  };

  return (
    <div className="inventory-page">
      {/* Dashboard Navbar Role Admin / Pengelola */}
      <DashboardNavbar
        role="admin"
        storeName="Cabang Utama Toko"
        userName="Pengelola 01"
        userRoleLabel="Admin / Pengelola"
      />

      {/* Main Content Area */}
      <main className="inventory-main">
        <div className="inventory-container">
          {/* Low Stock Warning Alert Banner */}
          {lowStockCount > 0 && (
            <section className="inventory-alert-banner" role="alert" aria-live="polite">
              <div className="inventory-alert-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="inventory-alert-text">
                <h2 className="inventory-alert-title">
                  Peringatan Stok Menipis (Low Stock Alert)
                </h2>
                <p className="inventory-alert-subtitle">
                  {lowStockCount} bahan berada di bawah batas minimum stok.
                </p>
              </div>
            </section>
          )}

          {/* Two-Column Grid: Left (Raw Material Inventory) & Right (Recipes Deduction) */}
          <div className="inventory-grid">
            {/* Left Column: Raw Inventory Table Card */}
            <section className="inventory-card inventory-card--raw" aria-labelledby="inventory-raw-title">
              <div className="inventory-card-header">
                <h1 id="inventory-raw-title" className="inventory-card-title">
                  Inventaris Bahan Raw (Otomatis Terpotong)
                </h1>
                <button
                  type="button"
                  className="inventory-restock-btn"
                  onClick={handleOpenRestock}
                >
                  + Restock Bahan
                </button>
              </div>

              <div className="inventory-table-wrap">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th scope="col" className="col-name">Bahan Raw</th>
                      <th scope="col" className="col-stock">Sisa Stok</th>
                      <th scope="col" className="col-min">Min. Stok</th>
                      <th scope="col" className="col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const isMenipis = item.status === 'Menipis';
                      return (
                        <tr key={item.id} className="inventory-table-row">
                          <td className="cell-name">{item.name}</td>
                          <td className="cell-stock">{item.currentStock}</td>
                          <td className="cell-min">{item.minStock}</td>
                          <td className="cell-status">
                            <span
                              className={`inventory-status-pill ${
                                isMenipis
                                  ? 'inventory-status-pill--menipis'
                                  : 'inventory-status-pill--aman'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Right Column: Recipe & Stock Deduction Guide Card */}
            <section className="inventory-card inventory-card--recipes" aria-labelledby="inventory-recipes-title">
              <div className="inventory-recipes-header">
                <h2 id="inventory-recipes-title" className="inventory-card-title">
                  Resep &amp; Potong Stok Per Porsi
                </h2>
                <p className="inventory-recipes-desc">
                  Pengurangan stok terjadi pada simulasi setelah pembayaran berhasil.
                </p>
              </div>

              <div className="inventory-recipes-list">
                {RECIPES_DATA.map((recipe) => (
                  <div key={recipe.id} className="inventory-recipe-item">
                    <h3 className="inventory-recipe-name">{recipe.name}</h3>
                    <p className="inventory-recipe-ingredients">{recipe.ingredients}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Restock Modal */}
      {isRestockModalOpen && (
        <RestockModal
          isOpen={isRestockModalOpen}
          items={inventory}
          onClose={() => setIsRestockModalOpen(false)}
          onConfirm={handleConfirmRestock}
        />
      )}

      {/* Footer Bar */}
      <footer className="inventory-footer">
        <div className="inventory-footer-container">
          <p className="inventory-footer-copy">
            &copy; 2026 Moka Pro POS &amp; Roastery OS. Dirancang untuk operasional kopi spesialitas.
          </p>

          <div className="inventory-footer-status">
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
