import { useState } from 'react';
import './ProductCard.css';

/**
 * ProductCard component
 * Menampilkan kartu item produk di kasir
 *
 * @param {Object} props
 * @param {Object} props.product - Data produk { id, name, category, price, image_url, image }
 * @param {Function} props.onAddToCart - Callback saat produk ditambahkan ke keranjang
 */
export default function ProductCard({ product, onAddToCart }) {
  const { name, price, image_url: imageUrl, image } = product;
  const [imgFailed, setImgFailed] = useState(false);

  const resolvedImage = !imgFailed ? (imageUrl || image || null) : null;

  const formatPrice = (val) => {
    return `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
  };

  const handleClick = () => {
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <div
      className="product-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Product Image Thumbnail */}
      <div className="product-card-img-wrap">
        {resolvedImage ? (
          <img
            src={resolvedImage}
            alt={name}
            className="product-card-img"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3ece4',
              color: '#8c6d53',
            }}
          >
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="product-card-info">
        <h3 className="product-card-name">{name}</h3>

        <div className="product-card-bottom">
          <span className="product-card-price">{formatPrice(price)}</span>

          <button
            type="button"
            className="product-card-add-btn"
            aria-label={`Tambah ${name} ke keranjang`}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
