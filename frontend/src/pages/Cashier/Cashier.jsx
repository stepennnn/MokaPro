import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import Cart from '../../components/Cart/Cart';
import CustomizeProductModal from '../../components/CustomizeProductModal/CustomizeProductModal';
import TableSelectionModal from '../../components/TableSelectionModal/TableSelectionModal';
import SeatSelectionModal from '../../components/SeatSelectionModal/SeatSelectionModal';
import PaymentModal from '../../components/PaymentModal/PaymentModal';
import ReceiptModal from '../../components/ReceiptModal/ReceiptModal';
import { useAuth } from '../../auth/useAuth';
import { apiFetch, resolveAssetUrl } from '../../lib/api';
import espressoImg from '../../assets/product-espresso.png';
import latteImg from '../../assets/product-latte.png';
import kopiSusuImg from '../../assets/product-kopisusu.png';
import matchaImg from '../../assets/product-matcha.png';
import v60Img from '../../assets/product-v60.png';
import croissantImg from '../../assets/product-croissant.png';
import './Cashier.css';

function resolveProductImage(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('kopi susu')) return kopiSusuImg;
  if (lower.includes('matcha')) return matchaImg;
  if (lower.includes('latte')) return latteImg;
  if (lower.includes('v60')) return v60Img;
  if (lower.includes('croissant')) return croissantImg;
  return espressoImg;
}

function normalizeProduct(raw) {
  const categoryName = typeof raw.category === 'object' && raw.category !== null
    ? raw.category.name
    : (raw.category || '');

  return {
    id: Number(raw.id),
    code: raw.code || '',
    name: raw.name || '',
    category: categoryName,
    categoryId: typeof raw.category === 'object' && raw.category !== null ? raw.category.id : null,
    price: Number(raw.price) || 0,
    active: Boolean(raw.active),
    modifiers: Array.isArray(raw.modifiers) ? raw.modifiers : [],
    image_url: raw.image_url ? resolveAssetUrl(raw.image_url) : null,
    image: raw.image_url ? resolveAssetUrl(raw.image_url) : resolveProductImage(raw.name),
  };
}

function buildCartKey(productId, notes = '') {
  return `${productId}::${notes || ''}`;
}

export default function Cashier() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Semua']);
  const [taxRate, setTaxRate] = useState(0.1);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [cartItems, setCartItems] = useState([]);
  const [orderType, setOrderType] = useState('Dine-In');
  const [selectedTable, setSelectedTable] = useState('Tanpa Meja');
  const [seatCount, setSeatCount] = useState(1);

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [pendingTable, setPendingTable] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderFeedback, setOrderFeedback] = useState('');

  const fetchCatalogData = useCallback(async () => {
    const [productsResponse, categoriesResponse, configResponse] = await Promise.all([
      apiFetch('/api/products'),
      apiFetch('/api/categories'),
      apiFetch('/api/config'),
    ]);

    const [productsPayload, categoriesPayload, configPayload] = await Promise.all([
      productsResponse.json(),
      categoriesResponse.json(),
      configResponse.json(),
    ]);

    const normalizedProducts = Array.isArray(productsPayload.data)
      ? productsPayload.data.map(normalizeProduct).filter((p) => p.active)
      : [];
    const categoryNames = Array.isArray(categoriesPayload.data)
      ? categoriesPayload.data.map((c) => c.name).filter(Boolean)
      : [];
    const parsedTaxRate = Number(configPayload?.tax_rate);

    return {
      products: normalizedProducts,
      categories: ['Semua', ...categoryNames],
      taxRate: Number.isFinite(parsedTaxRate) && parsedTaxRate >= 0 ? parsedTaxRate : 0.1,
    };
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError('');

    try {
      const result = await fetchCatalogData();
      setProducts(result.products);
      setCategories(result.categories);
      setTaxRate(result.taxRate);
    } catch (requestError) {
      setCatalogError(requestError.message || 'Gagal memuat katalog menu dari server.');
    } finally {
      setLoadingCatalog(false);
    }
  }, [fetchCatalogData]);

  useEffect(() => {
    let cancelled = false;

    fetchCatalogData()
      .then((result) => {
        if (!cancelled) {
          setProducts(result.products);
          setCategories(result.categories);
          setTaxRate(result.taxRate);
          setCatalogError('');
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setCatalogError(requestError.message || 'Gagal memuat katalog menu dari server.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCatalog(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchCatalogData]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
      const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const subtotal = Math.round(
    cartItems.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0) * 100,
  ) / 100;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const handleOpenCustomize = (product) => {
    setSelectedProduct(product);
    setIsCustomizeModalOpen(true);
  };

  const handleCloseCustomize = () => {
    setIsCustomizeModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCartFromModal = (customizedProduct) => {
    const cartKey = buildCartKey(customizedProduct.id, customizedProduct.notes);
    setOrderFeedback('');

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.cartKey === cartKey);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      return [...prevItems, { ...customizedProduct, cartKey, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (cartKey, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.cartKey !== cartKey));
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.cartKey === cartKey ? { ...item, quantity: newQuantity } : item)),
      );
    }
  };

  const handleResetCart = () => setCartItems([]);

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setOrderError('');

    if (orderType === 'Takeaway') {
      setIsPaymentModalOpen(true);
    } else {
      setIsTableModalOpen(true);
    }
  };

  const handleConfirmTable = (tableName, type = 'Dine-In', maxSeats = 0) => {
    setIsTableModalOpen(false);

    if (type === 'Takeaway') {
      setSelectedTable('Tanpa Meja');
      setOrderType('Takeaway');
      setSeatCount(1);
      setIsPaymentModalOpen(true);
    } else {
      setPendingTable({ name: tableName, maxSeats });
      setIsSeatModalOpen(true);
    }
  };

  const handleSeatConfirm = (selectedSeats) => {
    if (pendingTable?.maxSeats && selectedSeats > pendingTable.maxSeats) {
      alert(`Maaf, ${pendingTable.name} hanya muat maksimal ${pendingTable.maxSeats} orang.`);
      return;
    }

    setSelectedTable(pendingTable.name);
    setOrderType('Dine-In');
    setSeatCount(selectedSeats);
    setIsSeatModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentConfirm = async ({ method, cashReceived, change }) => {
    setSubmittingOrder(true);
    setOrderError('');

    try {
      const response = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          type: orderType,
          table_number: orderType === 'Dine-In' && selectedTable !== 'Tanpa Meja' ? selectedTable : null,
          seats: orderType === 'Dine-In' ? seatCount : null,
          payment_method: method,
          items: cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            notes: item.notes || null,
            ...(Array.isArray(item.modifierIds) && item.modifierIds.length > 0
              ? { modifier_ids: item.modifierIds }
              : {}),
          })),
        }),
      });

      const payload = await response.json();
      const createdOrder = payload?.data || null;
      const orderNumber = createdOrder?.order_number || '-';

      setIsPaymentModalOpen(false);
      setCartItems([]);
      setSelectedTable('Tanpa Meja');
      setOrderType('Dine-In');
      setSeatCount(1);
      setOrderFeedback(`Pembayaran berhasil (${orderNumber}). Pesanan telah dikirim ke Dapur.`);

      if (createdOrder) {
        setReceiptData({
          order: createdOrder,
          cashReceived: method === 'cash' ? cashReceived : null,
          change: method === 'cash' ? change : null,
          taxRate,
        });
      }
    } catch (requestError) {
      setOrderError(requestError.message || 'Gagal memproses pembayaran. Silakan coba lagi.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleHoldOrder = () => {
    setOrderFeedback('Fitur tahan pesanan sementara tersedia pada sesi aktif.');
  };

  return (
    <div className="cashier-page">
      <DashboardNavbar storeName="Cabang Utama Toko" />

      <main className="cashier-main">
        <div className="cashier-container">
          <section className="cashier-products-section">
            {orderFeedback && (
              <div
                role="status"
                style={{
                  marginBottom: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#eef8f0',
                  color: '#1f6e3d',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {orderFeedback}
              </div>
            )}

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
              {categories.map((cat) => (
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
              {loadingCatalog ? (
                <p role="status" style={{ padding: '24px', textAlign: 'center', color: '#7a6d64' }}>
                  Memuat katalog menu...
                </p>
              ) : catalogError ? (
                <div role="alert" style={{ padding: '24px', textAlign: 'center', color: '#b91c1c' }}>
                  <p>{catalogError}</p>
                  <button type="button" className="cashier-option-btn" onClick={loadCatalog} style={{ marginTop: '8px' }}>
                    Muat Ulang
                  </button>
                </div>
              ) : (
                <ProductGrid products={filteredProducts} onAddToCart={handleOpenCustomize} />
              )}
            </div>
          </section>

          <section className="cashier-cart-section">
            <Cart
              cartItems={cartItems}
              orderType={orderType}
              tableLocation={cartItems.length > 0 ? selectedTable : 'Tanpa Meja'}
              taxRate={taxRate}
              onUpdateQuantity={handleUpdateQuantity}
              onResetCart={handleResetCart}
              onHoldOrder={handleHoldOrder}
              onCheckout={handleCheckout}
            />
          </section>
        </div>
      </main>

      {isCustomizeModalOpen && selectedProduct && (
        <CustomizeProductModal
          key={selectedProduct.id}
          isOpen={isCustomizeModalOpen}
          product={selectedProduct}
          onClose={handleCloseCustomize}
          onAddToCart={handleAddToCartFromModal}
        />
      )}

      {isTableModalOpen && (
        <TableSelectionModal
          key={selectedTable}
          isOpen={isTableModalOpen}
          currentTable={selectedTable}
          onClose={() => setIsTableModalOpen(false)}
          onConfirmTable={handleConfirmTable}
        />
      )}

      {isSeatModalOpen && pendingTable && (
        <SeatSelectionModal
          isOpen={isSeatModalOpen}
          tableName={pendingTable.name}
          onClose={() => setIsSeatModalOpen(false)}
          onConfirm={handleSeatConfirm}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          total={total}
          submitting={submittingOrder}
          error={orderError}
          onClose={() => {
            if (!submittingOrder) {
              setIsPaymentModalOpen(false);
              setOrderError('');
            }
          }}
          onPaymentConfirm={handlePaymentConfirm}
        />
      )}

      {receiptData && (
        <ReceiptModal
          isOpen={Boolean(receiptData)}
          order={receiptData.order}
          cashReceived={receiptData.cashReceived}
          change={receiptData.change}
          taxRate={receiptData.taxRate}
          fallbackCashierName={user?.name || ''}
          onClose={() => setReceiptData(null)}
        />
      )}

      <footer className="cashier-footer">
        <div className="cashier-footer-container">
          <p className="cashier-footer-copy">© 2026 Moka Pro POS &amp; Roastery OS.</p>
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
