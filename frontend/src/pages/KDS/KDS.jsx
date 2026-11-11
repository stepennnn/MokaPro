import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import './KDS.css';

export default function KDS() {
  const [orders, setOrders] = useState([]);

  // 1. Ambil data pesanan dari localStorage saat halaman dimuat
  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('mokapro_kds')) || [];
    setOrders(savedOrders);
  }, []);

  // 2. Fungsi untuk mengubah status pesanan (Menunggu -> Diproses -> Selesai)
  const updateStatus = (orderId, newStatus) => {
    // Update state lokal
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    
    setOrders(updatedOrders);
    
    // Simpan perubahan ke localStorage
    localStorage.setItem('mokapro_kds', JSON.stringify(updatedOrders));

    // Jika pesanan selesai, berikan notifikasi bahwa meja sudah kosong
    if (newStatus === 'Selesai') {
      const finishedOrder = updatedOrders.find(o => o.id === orderId);
      if (finishedOrder && finishedOrder.table !== 'Tanpa Meja') {
        // Notifikasi kecil (opsional, bisa dihapus jika mengganggu)
        console.log(`Meja ${finishedOrder.table} kini kosong.`);
      }
    }
  };

  // Hitung jumlah pesanan berdasarkan status untuk indikator di atas
  const countMenunggu = orders.filter(o => o.status === 'Menunggu').length;
  const countDiproses = orders.filter(o => o.status === 'Diproses').length;
  const countSelesai = orders.filter(o => o.status === 'Selesai').length;

  return (
    <div className="kds-page">
      <DashboardNavbar role="barista" userName="Barista 01" userRoleLabel="Barista" />
      <main className="kds-main">
        <div className="kds-header">
          <div>
            <h1 className="page-title">Antrean Pesanan Barista & Dapur</h1>
            <p className="page-subtitle">Monitor pesanan langsung tanpa cetak struk (Paperless KDS)</p>
          </div>
          
          {/* Indikator Status */}
          <div className="filter-tabs">
            <span className="tab pending">Menunggu: {countMenunggu}</span>
            <span className="tab processing">Diproses: {countDiproses}</span>
            <span className="tab done">Selesai: {countSelesai}</span>
          </div>
        </div>

        <div className="kds-grid">
          {orders.length === 0 ? (
            <div className="empty-kds" style={{ padding: '40px', textAlign: 'center', color: '#7a6d64', gridColumn: '1 / -1' }}>
              Belum ada antrean pesanan masuk dari Kasir.
            </div>
          ) : (
            orders.map((order) => (
              <div 
                key={order.id} 
                className={`kds-card ${
                  order.status === 'Menunggu' ? 'pending' : 
                  order.status === 'Diproses' ? 'processing' : 'completed'
                }`}
              >
                {/* Header Kartu Pesanan */}
                <div className="kds-card-header">
                  <span className="order-id">{order.id}</span>
                  <span className="order-table">
                    {order.table} {order.seats > 0 && order.table !== 'Tanpa Meja' ? `(${order.seats} Org)` : ''}
                  </span>
                  <span className="order-time">⏱ {order.time}</span>
                </div>
                
                <p className="customer-info">{order.type} • {order.method}</p>
                
                {/* Daftar Item Pesanan */}
                <div className="kds-card-body">
                  {order.items.map((item, idx) => (
                    <div key={idx}>
                      <p><strong>{item.quantity}x</strong> {item.name}</p>
                      {item.notes && <p className="notes">{item.notes}</p>}
                    </div>
                  ))}
                </div>
                
                {/* Tombol Aksi Berdasarkan Status */}
                {order.status === 'Menunggu' && (
                  <button className="kds-btn process" onClick={() => updateStatus(order.id, 'Diproses')}>
                    Mulai Racik Pesanan
                  </button>
                )}
                
                {order.status === 'Diproses' && (
                  <button className="kds-btn done" onClick={() => updateStatus(order.id, 'Selesai')}>
                    ✓ Selesai & Disajikan
                  </button>
                )}
                
                {order.status === 'Selesai' && (
                  <div className="completed-status">✓ Pesanan Sudah Selesai</div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}