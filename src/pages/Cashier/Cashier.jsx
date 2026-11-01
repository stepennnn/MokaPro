import { useState, useMemo } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import Cart from '../../components/Cart/Cart';
import CustomizeProductModal from '../../components/CustomizeProductModal/CustomizeProductModal';
import TableSelectionModal from '../../components/TableSelectionModal/TableSelectionModal';
import PaymentModal from '../../components/PaymentModal/PaymentModal';
import PaymentSuccessModal from '../../components/PaymentSuccessModal/PaymentSuccessModal';
import ReceiptModal from '../../components/ReceiptModal/ReceiptModal';
import espressoImg from '../../assets/product-espresso.png';
import latteImg from '../../assets/product-latte.png';
import kopiSusuImg from '../../assets/product-kopisusu.png';
import matchaImg from '../../assets/product-matcha.png';
import v60Img from '../../assets/product-v60.png';
import croissantImg from '../../assets/product-croissant.png';
import './Cashier.css';

// Master data produk sesuai desain Figma
const PRODUCTS_DATA = [
  {
    id: 1,
    name: 'Espresso Double',
    category: 'Espresso Based',
    price: 22000,
    image: espressoImg,
    notes: 'Normal'
  },
  {
    id: 2,
    name: 'Caffe Latte',
    category: 'Espresso Based',
    price: 28000,
    image: latteImg,
    notes: 'Hot'
  },
  {
    id: 3,
    name: 'Kopi Susu Gula Aren',
    category: 'Espresso Based',
    price: 25000,
    image: kopiSusuImg,
    notes: 'Sedikit Es, Gula Normal'
  },
  {
    id: 4,
    name: 'Matcha Latte',
    category: 'Non-Coffee',
    price: 30000,
    image: matchaImg,
    notes: 'Ice'
  },
  {
    id: 5,
    name: 'V60 Single Origin',
    category: 'Manual Brew',
    price: 32000,
    image: v60Img,
    notes: 'Beans Gayo'
  },
  {
    id: 6,
    name: 'Butter Croissant',
    category: 'Pastry & Food',
    price: 24000,
    image: croissantImg,
    notes: 'Hangatkan'
  }
];

const CATEGORIES = [
  'Semua',
  'Espresso Based',
  'Non-Coffee',
  'Manual Brew',
  'Pastry & Food'
];

/**
 * Cashier Page Component
 * Route: /cashier
 * Menangani alur POS Kasir: pencarian, filter kategori, penambahan ke cart dengan Customize Modal,
 * pemilihan meja (Table Selection Modal), dan checkout
 */
export default function Cashier() {
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState('Dine-In'); // 'Dine-In' | 'Takeaway'
  const [selectedTable, setSelectedTable] = useState('Meja 01');

  // Modal States
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);
  const [transactionCount, setTransactionCount] = useState(1);

  // Filter produk berdasarkan kategori dan pencarian
  const filteredProducts = useMemo(() => {
    return PRODUCTS_DATA.filter((product) => {
      const matchCategory =
        selectedCategory === 'Semua' || product.category === selectedCategory;
      const matchSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Hitung total (sudah termasuk PB1 10%)
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const total = subtotal + Math.round(subtotal * 0.1);

  // Buka modal kustomisasi saat produk diklik
  const handleOpenCustomize = (product) => {
    setSelectedProduct(product);
    setIsCustomizeModalOpen(true);
  };

  const handleCloseCustomize = () => {
    setIsCustomizeModalOpen(false);
    setSelectedProduct(null);
  };

  // Tambah produk dari modal kustomisasi ke keranjang
  const handleAddToCartFromModal = (customizedProduct) => {
    const itemNotes = customizedProduct.notes || '';
    const cartItemId = `${customizedProduct.id}__${itemNotes}`;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) =>
          item.id === customizedProduct.id &&
          (item.notes || '') === itemNotes
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      }

      return [
        ...prevItems,
        {
          ...customizedProduct,
          cartItemId,
          quantity: 1
        }
      ];
    });
  };

  // Update kuantitas item di keranjang berdasarkan kombinasi product id + notes / cartItemId
  const handleUpdateQuantity = (identifier, newQuantity, notes) => {
    setCartItems((prev) => {
      if (newQuantity <= 0) {
        return prev.filter((item) => {
          const itemKey = item.cartItemId || `${item.id}__${item.notes || ''}`;
          if (itemKey === identifier) return false;
          if (
            notes !== undefined &&
            item.id === identifier &&
            (item.notes || '') === (notes || '')
          ) {
            return false;
          }
          return true;
        });
      }
      return prev.map((item) => {
        const itemKey = item.cartItemId || `${item.id}__${item.notes || ''}`;
        const isMatch =
          itemKey === identifier ||
          (notes !== undefined &&
            item.id === identifier &&
            (item.notes || '') === (notes || ''));

        return isMatch ? { ...item, quantity: newQuantity } : item;
      });
    });
  };

  // Kosongkan keranjang
  const handleResetCart = () => {
    setCartItems([]);
  };

  // Buka modal denah meja dari tombol Checkout (Proses Bayar) atau toolbar
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setIsTableModalOpen(true);
  };

  // Konfirmasi meja dari TableSelectionModal → buka PaymentModal
  const handleConfirmTable = (tableName, type = 'Dine-In') => {
    setSelectedTable(tableName);
    setOrderType(type);
    setIsTableModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  // Konfirmasi pembayaran dari PaymentModal → buka PaymentSuccessModal
  const handlePaymentConfirm = ({ method, cashReceived, change }) => {
    const trxId = `TRX-${String(1000 + transactionCount).padStart(5, '0')}`;
    const newTransaction = {
      id: trxId,
      timestamp: new Date(),
      cashierName: 'Kasir 01',
      orderType,
      selectedTable,
      cartItems: [...cartItems],
      subtotal,
      pb1: Math.round(subtotal * 0.1),
      total,
      method,
      cashReceived,
      change
    };

    setCompletedTransaction(newTransaction);
    setTransactionCount((prev) => prev + 1);
    setIsPaymentModalOpen(false);
    setIsPaymentSuccessOpen(true);
    // Transaksi sementara dipertahankan untuk kebutuhan struk (Receipt)
  };

  // Buka modal struk dari PaymentSuccessModal
  const handleOpenReceipt = () => {
    setIsPaymentSuccessOpen(false);
    setIsReceiptOpen(true);
  };

  // Selesai transaksi & reset state untuk transaksi baru
  const handleFinishTransaction = () => {
    setIsPaymentSuccessOpen(false);
    setIsReceiptOpen(false);
    setCartItems([]);
    setSelectedTable('Meja 01');
    setOrderType('Dine-In');
    setCompletedTransaction(null);
  };

  const handleHoldOrder = () => {
    alert('Pesanan telah ditahan');
  };

  return (
    <div className="cashier-page">
      {/* Dashboard Navbar */}
      <DashboardNavbar
        role="cashier"
        storeName="Cabang Utama Toko"
        userName="Kasir 01"
        userRoleLabel="Kasir"
      />

      {/* Main Content: Left (Products) & Right (Cart) */}
      <main className="cashier-main">
        <div className="cashier-container">
          {/* Left Column: Search, Order Mode, Categories, Product Grid */}
          <section className="cashier-products-section">
            {/* Top Toolbar: Search + Dine-In/Takeaway / Table */}
            <div className="cashier-toolbar">
              <div className="cashier-search-wrap">
                <input
                  type="text"
                  className="cashier-search-input"
                  placeholder=""
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Cari menu produk"
                />
              </div>

              <div className="cashier-order-options">
                <button
                  type="button"
                  className="cashier-option-btn table-select-btn"
                  onClick={() => setIsTableModalOpen(true)}
                >
                  <svg
                    className="option-icon"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>Pilih Meja</span>
                </button>

                <button
                  type="button"
                  className={`cashier-option-btn mode-btn ${
                    orderType === 'Dine-In' ? 'active' : ''
                  }`}
                  onClick={() => setOrderType('Dine-In')}
                >
                  Dine-In
                </button>

                <button
                  type="button"
                  className={`cashier-option-btn mode-btn ${
                    orderType === 'Takeaway' ? 'active' : ''
                  }`}
                  onClick={() => {
                    setOrderType('Takeaway');
                    setSelectedTable('Tanpa Meja');
                  }}
                >
                  Takeaway
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="cashier-categories-bar" role="tablist" aria-label="Filter Kategori Menu">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`cashier-category-pill ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Products Grid */}
            <div className="cashier-grid-wrap">
              <ProductGrid
                products={filteredProducts}
                onAddToCart={handleOpenCustomize}
              />
            </div>
          </section>

          {/* Right Column: Transaction Cart Panel */}
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

      {/* Customize Product Modal */}
      {isCustomizeModalOpen && selectedProduct && (
        <CustomizeProductModal
          key={selectedProduct.id}
          isOpen={isCustomizeModalOpen}
          product={selectedProduct}
          onClose={handleCloseCustomize}
          onAddToCart={handleAddToCartFromModal}
        />
      )}

      {/* Table Selection Modal */}
      {isTableModalOpen && (
        <TableSelectionModal
          key={selectedTable}
          isOpen={isTableModalOpen}
          currentTable={selectedTable}
          onClose={() => setIsTableModalOpen(false)}
          onConfirmTable={handleConfirmTable}
        />
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          total={total}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentConfirm={handlePaymentConfirm}
        />
      )}

      {/* Payment Success Modal */}
      {isPaymentSuccessOpen && completedTransaction && (
        <PaymentSuccessModal
          isOpen={isPaymentSuccessOpen}
          transaction={completedTransaction}
          onClose={handleFinishTransaction}
          onViewReceipt={handleOpenReceipt}
          onFinish={handleFinishTransaction}
        />
      )}

      {/* Receipt Modal */}
      {isReceiptOpen && completedTransaction && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          transaction={completedTransaction}
          onClose={handleFinishTransaction}
        />
      )}

      {/* Footer Bar */}
      <footer className="cashier-footer">
        <div className="cashier-footer-container">
          <p className="cashier-footer-copy">
            © 2026 Moka Pro POS &amp; Roastery OS. Dirancang untuk operasional kopi spesialitas.
          </p>

          <div className="cashier-footer-status">
            <div className="status-indicator">
              <span className="status-dot" aria-hidden="true"></span>
              <span className="status-text">Cloud Tersinkronisasi</span>
            </div>
            <span className="status-separator" aria-hidden="true">•</span>
            <span className="terminal-id">Terminal #01</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
