import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import RestockModal from '../../components/RestockModal/RestockModal'; 
import './Inventory.css';

const INITIAL_STOCKS = [
  { id: 1, name: 'Biji Kopi Houseblend (Arabica)', stock: 2400, min: 500, unit: 'g' },
  { id: 2, name: 'Susu Fresh Milk (UHT)', stock: 8500, min: 2000, unit: 'ml' },
  { id: 3, name: 'Sirup Gula Aren Organik', stock: 450, min: 500, unit: 'ml' }, 
  { id: 4, name: 'Bubuk Matcha Premium', stock: 800, min: 200, unit: 'g' },
  { id: 5, name: 'Croissant Frozen Stock', stock: 12, min: 15, unit: 'pcs' },
];

export default function Inventory() {
  const [stocks, setStocks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const savedStocks = JSON.parse(localStorage.getItem('mokapro_stocks'));
    if (savedStocks) setStocks(savedStocks);
    else {
      setStocks(INITIAL_STOCKS);
      localStorage.setItem('mokapro_stocks', JSON.stringify(INITIAL_STOCKS));
    }
  }, []);

  const handleRestockSave = (id, amount) => {
    const updatedStocks = stocks.map(item => 
      item.id === id ? { ...item, stock: item.stock + amount } : item
    );
    setStocks(updatedStocks);
    localStorage.setItem('mokapro_stocks', JSON.stringify(updatedStocks));
    alert('Stok berhasil ditambahkan!');
  };

  const lowStockCount = stocks.filter(item => item.stock <= item.min).length;

  return (
    <div className="inventory-page">
      <DashboardNavbar role="admin" userName="Pengelola 01" userRoleLabel="Admin" />
      <main className="inventory-main">
        {lowStockCount > 0 && (
          <div className="alert-banner">
            ⚠️ <strong>Peringatan Stok Menipis</strong> <br/>
            <span>{lowStockCount} bahan berada di bawah ambang batas minimum stok.</span>
          </div>
        )}

        <div className="inventory-content">
          <div className="raw-materials-panel">
            <div className="panel-header">
              <h3>Inventaris Bahan Raw (Otomatis Terpotong)</h3>
              <button className="btn-restock" onClick={() => setIsModalOpen(true)}>
                + Restock Bahan
              </button>
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bahan Raw</th>
                  <th>Sisa Stok</th>
                  <th>Min. Stok</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td><strong>{item.stock.toLocaleString('id-ID')}</strong> {item.unit}</td>
                    <td>{item.min.toLocaleString('id-ID')} {item.unit}</td>
                    <td>
                      <span className={`status ${item.stock <= item.min ? 'low' : 'safe'}`}>
                        {item.stock <= item.min ? 'Menipis' : 'Aman'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="recipe-panel">
            <h3>Resep & Potong Stok Per Porsi</h3>
            <p className="subtitle">Pengurangan stok terjadi pada simulasi setelah pembayaran berhasil.</p>
            
            <div className="recipe-card">
              <h4>Espresso Double</h4>
              <p>• Biji Kopi Houseblend (Arabica) <span>-18 g / porsi</span></p>
            </div>
            <div className="recipe-card">
              <h4>Caffe Latte</h4>
              <p>• Biji Kopi Houseblend (Arabica) <span>-18 g / porsi</span></p>
              <p>• Susu Fresh Milk (UHT) <span>-150 ml / porsi</span></p>
            </div>
            <div className="recipe-card">
              <h4>Kopi Susu Gula Aren</h4>
              <p>• Biji Kopi Houseblend (Arabica) <span>-18 g / porsi</span></p>
              <p>• Susu Fresh Milk (UHT) <span>-120 ml / porsi</span></p>
              <p>• Sirup Gula Aren Organik <span>-20 ml / porsi</span></p>
            </div>
          </div>
        </div>
      </main>

      <RestockModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        stocks={stocks} 
        onSave={handleRestockSave} 
      />
    </div>
  );
}