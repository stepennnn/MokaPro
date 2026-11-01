import { useState } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import OrderCard from '../../components/OrderCard/OrderCard';
import './KDS.css';

// Master data awal antrean pesanan sesuai referensi visual kds.png
const INITIAL_ORDERS = [
  {
    id: 'ORD-1001',
    table: 'Meja 04',
    customer: 'Ahmad',
    status: 'processing', // Diproses
    itemsSummary: '2x Kopi Susu Gula Aren, 1x Butter Croissant',
    notes: 'Sedikit es · Hangatkan'
  },
  {
    id: 'ORD-1002',
    table: 'Meja 02',
    customer: 'Siti',
    status: 'waiting', // Menunggu
    itemsSummary: '1x Caffe Latte, 1x Matcha Latte',
    notes: 'Susu oat'
  },
  {
    id: 'ORD-1000',
    table: 'Takeaway',
    customer: 'Budi',
    status: 'completed', // Selesai
    itemsSummary: '1x V60 Single Origin',
    notes: 'Biji Gayo'
  }
];

/**
 * KDS (Kitchen Display System) Page Component
 * Route: /kds
 * Layar antrean pesanan untuk Barista & Dapur
 */
export default function KDS() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  // Hitung jumlah pesanan berdasarkan status secara reaktif
  const waitingCount = orders.filter((o) => o.status === 'waiting').length;
  const processingCount = orders.filter((o) => o.status === 'processing').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  // Handler transisi status pesanan
  const handleStatusChange = (orderId, nextStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: nextStatus } : order
      )
    );
  };

  return (
    <div className="kds-page">
      {/* Dashboard Navbar Role Barista */}
      <DashboardNavbar
        role="barista"
        storeName="Cabang Utama Toko"
        userName="Barista 01"
        userRoleLabel="Barista / Dapur"
      />

      {/* Main KDS Content Area */}
      <main className="kds-main">
        <div className="kds-container">
          {/* Header Banner */}
          <section className="kds-header-banner" aria-labelledby="kds-title">
            <div className="kds-header-info">
              <h1 id="kds-title" className="kds-header-title">
                Antrean Pesanan Barista &amp; Dapur
              </h1>
              <p className="kds-header-subtitle">
                Monitor pesanan langsung tanpa kertas struk (Paperless KDS)
              </p>
            </div>

            {/* Status Counter Badges */}
            <div className="kds-badges-group" role="status" aria-label="Ringkasan Antrean Pesanan">
              <span className="kds-badge kds-badge--waiting">
                Menunggu: {waitingCount}
              </span>
              <span className="kds-badge kds-badge--processing">
                Diproses: {processingCount}
              </span>
              <span className="kds-badge kds-badge--completed">
                Selesai: {completedCount}
              </span>
            </div>
          </section>

          {/* Orders Grid */}
          <section className="kds-grid-section" aria-label="Daftar Tiket Antrean Pesanan">
            <div className="kds-orders-grid">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="kds-footer">
        <div className="kds-footer-container">
          <p className="kds-footer-copy">
            &copy; 2026 Moka Pro POS &amp; Roastery OS. Dirancang untuk operasional kopi spesialitas.
          </p>

          <div className="kds-footer-status">
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
