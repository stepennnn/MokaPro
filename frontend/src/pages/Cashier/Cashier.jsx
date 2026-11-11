import { useState, useEffect, useMemo } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import Cart from '../../components/Cart/Cart';
import CustomizeProductModal from '../../components/CustomizeProductModal/CustomizeProductModal';
import TableSelectionModal from '../../components/TableSelectionModal/TableSelectionModal';
import SeatSelectionModal from '../../components/SeatSelectionModal/SeatSelectionModal'; // Import Modal Baru
import PaymentModal from '../../components/PaymentModal/PaymentModal';
import espressoImg from '../../assets/product-espresso.png';
import latteImg from '../../assets/product-latte.png';
import kopiSusuImg from '../../assets/product-kopisusu.png';
import matchaImg from '../../assets/product-matcha.png';
import v60Img from '../../assets/product-v60.png';
import croissantImg from '../../assets/product-croissant.png';
import './Cashier.css';

const CATEGORIES = [
  'Semua',
  'Espresso Based',
  'Non-Coffee',
  'Manual Brew',
  'Pastry & Food'
];

export default function Cashier() {
  // State Produk & Filter
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // State Keranjang & Pesanan
  const [cartItems, setCartItems] = useState([]);
  const [orderType, setOrderType] = useState('Dine-In');
  const [selectedTable, setSelectedTable] = useState('Tanpa Meja');
  
  // State Modals
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false); // State Modal Input Kursi
  const [pendingTable, setPendingTable] = useState(null); // Menyimpan meja sementara sebelum input kursi
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Ambil data produk dari localStorage (atau fallback)
  useEffect(() => {
    const savedProducts = JSON.parse(localStorage.getItem('mokapro_products'));
    
    if (savedProducts) {
      const activeProducts = savedProducts.filter(p => p.status === 'Aktif');
      const mappedProducts = activeProducts.map(dbProduct => {
        let img = espressoImg; 
        if (dbProduct.name.includes('Latte')) img = latteImg;
        if (dbProduct.name.includes('Kopi Susu')) img = kopiSusuImg;
        if (dbProduct.name.includes('Matcha')) img = matchaImg;
        if (dbProduct.name.includes('V60')) img = v60Img;
        if (dbProduct.name.includes('Croissant')) img = croissantImg;
        return { ...dbProduct, image: img };
      });
      setProducts(mappedProducts);
    }
  }, []);

  // Filter Produk
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
      const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Hitung Total
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal + Math.round(subtotal * 0.1);

  // --- FUNGSI KERANJANG ---
  const handleOpenCustomize = (product) => {
    setSelectedProduct(product);
    setIsCustomizeModalOpen(true);
  };

  const handleCloseCustomize = () => {
    setIsCustomizeModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCartFromModal = (customizedProduct) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.id === customizedProduct.id && item.notes === customizedProduct.notes
      );
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
        return updated;
      }
      return [...prevItems, { ...customizedProduct, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== productId));
    } else {
      setCartItems((prev) => prev.map((item) => item.id === productId ? { ...item, quantity: newQuantity } : item));
    }
  };

  const handleResetCart = () => setCartItems([]);

  // --- FUNGSI CHECKOUT & MEJA ---
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    if (orderType === 'Takeaway') {
      setIsPaymentModalOpen(true); // Langsung bayar jika takeaway
    } else {
      setIsTableModalOpen(true); // Pilih meja jika Dine-In
    }
  };

  // Dipanggil saat meja dipilih dari denah
  const handleConfirmTable = (tableName, type = 'Dine-In', maxSeats = 0) => {
    setIsTableModalOpen(false);
    
    if (type === 'Takeaway') {
      setSelectedTable('Tanpa Meja');
      setOrderType('Takeaway');
      setIsPaymentModalOpen(true);
    } else {
      // Buka modal input jumlah kursi
      setPendingTable({ name: tableName, maxSeats });
      setIsSeatModalOpen(true);
    }
  };

  // Dipanggil saat kasir memasukkan jumlah kursi
  const handleSeatConfirm = (seatCount) => {
    if (seatCount > pendingTable.maxSeats) {
      alert(`Maaf, Meja ${pendingTable.name} hanya muat maksimal ${pendingTable.maxSeats} orang.`);
      return;
    }
    
    setSelectedTable(pendingTable.name);
    setOrderType('Dine-In');
    setIsSeatModalOpen(false);
    setIsPaymentModalOpen(true);

    // Simpan jumlah kursi sementara di localStorage untuk dikirim ke KDS
    localStorage.setItem('mokapro_temp_seats', seatCount);
  };

  // --- FUNGSI PEMBAYARAN SUKSES ---
  const handlePaymentConfirm = ({ method, cashReceived, change }) => {
    setIsPaymentModalOpen(false);
    
    // 1. Buat ID Transaksi
    const trxId = `TRX-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const seatCount = localStorage.getItem('mokapro_temp_seats') || 1;

    // 2. Susun data pesanan
    const newOrder = {
      id: trxId,
      date: new Date().toLocaleString('id-ID'),
      type: orderType,
      table: selectedTable,
      seats: seatCount,
      items: cartItems,
      subtotal: subtotal,
      tax: Math.round(subtotal * 0.1),
      total: total,
      method: method === 'qris' ? 'QRIS' : 'Tunai',
      status: 'Selesai'
    };

    // 3. Simpan ke Riwayat (History)
    const existingHistory = JSON.parse(localStorage.getItem('mokapro_history')) || [];
    localStorage.setItem('mokapro_history', JSON.stringify([newOrder, ...existingHistory]));

    // 4. Simpan ke Antrean Dapur (KDS)
    const existingKDS = JSON.parse(localStorage.getItem('mokapro_kds')) || [];
    const kdsOrder = { 
      ...newOrder, 
      status: 'Menunggu', 
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
    };
    localStorage.setItem('mokapro_kds', JSON.stringify([kdsOrder, ...existingKDS]));

    // 5. Notifikasi & Reset
    alert(`Pembayaran Berhasil!\nID: ${trxId}\nPesanan dikirim ke Dapur.`);
    setCartItems([]);
    setSelectedTable('Tanpa Meja');
    setOrderType('Dine-In');
    localStorage.removeItem('mokapro_temp_seats');
  };

  const handleHoldOrder = () => alert('Pesanan telah ditahan');

  // --- TAMPILAN UI ---
  return (
    <div className="cashier-page">
      <DashboardNavbar role="cashier" storeName="Cabang Utama Toko" userName="Kasir 01" userRoleLabel="Kasir" />

      <main className="cashier-main">
        <div className="cashier-container">
          <section className="cashier-products-section">
            <div className="cashier-toolbar">
              <div className="cashier-search-wrap">
                <input
                  type="text"
                  className="cashier-search-input"
                  placeholder="Cari menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="cashier-order-options">
                <button type="button" className="cashier-option-btn table-select-btn" onClick={() => setIsTableModalOpen(true)}>
                  <svg className="option-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>{selectedTable !== 'Tanpa Meja' ? selectedTable : 'Pilih Meja'}</span>
                </button>

                <button type="button" className={`cashier-option-btn mode-btn ${orderType === 'Dine-In' ? 'active' : ''}`} onClick={() => setOrderType('Dine-In')}>
                  Dine-In
                </button>

                <button type="button" className={`cashier-option-btn mode-btn ${orderType === 'Takeaway' ? 'active' : ''}`} onClick={() => { setOrderType('Takeaway'); setSelectedTable('Tanpa Meja'); }}>
                  Takeaway
                </button>
              </div>
            </div>

            <div className="cashier-categories-bar" role="tablist">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`cashier-category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="cashier-grid-wrap">
              <ProductGrid products={filteredProducts} onAddToCart={handleOpenCustomize} />
            </div>
          </section>

          <section className="cashier-cart-section">
            <Cart
              cartItems={cartItems}
              orderType={orderType}
              tableLocation={cartItems.length > 0 ? selectedTable : 'Tanpa Meja'}
              onUpdateQuantity={handleUpdateQuantity}
              onResetCart={handleResetCart}
              onHoldOrder={handleHoldOrder}
              onCheckout={handleCheckout}
            />
          </section>
        </div>
      </main>

      {/* Modal Kustomisasi Produk */}
      {isCustomizeModalOpen && selectedProduct && (
        <CustomizeProductModal
          key={selectedProduct.id}
          isOpen={isCustomizeModalOpen}
          product={selectedProduct}
          onClose={handleCloseCustomize}
          onAddToCart={handleAddToCartFromModal}
        />
      )}

      {/* Modal Denah Meja */}
      {isTableModalOpen && (
        <TableSelectionModal
          key={selectedTable}
          isOpen={isTableModalOpen}
          currentTable={selectedTable}
          onClose={() => setIsTableModalOpen(false)}
          onConfirmTable={handleConfirmTable}
        />
      )}

      {/* Modal Input Jumlah Kursi (BARU) */}
      {isSeatModalOpen && pendingTable && (
        <SeatSelectionModal
          isOpen={isSeatModalOpen}
          tableName={pendingTable.name}
          onClose={() => setIsSeatModalOpen(false)}
          onConfirm={handleSeatConfirm}
        />
      )}

      {/* Modal Pembayaran */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          total={total}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentConfirm={handlePaymentConfirm}
        />
      )}

      <footer className="cashier-footer">
        <div className="cashier-footer-container">
          <p className="cashier-footer-copy">© 2026 Moka Pro POS & Roastery OS.</p>
          <div className="cashier-footer-status">
            <div className="status-indicator"><span className="status-dot"></span><span className="status-text">Cloud Tersinkronisasi</span></div>
            <span className="status-separator">•</span>
            <span className="terminal-id">Terminal #01</span>
          </div>
        </div>
      </footer>
    </div>
  );
}