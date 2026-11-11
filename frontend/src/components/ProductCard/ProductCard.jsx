import './ProductCard.css';

/**
 * ProductCard component
 * Menampilkan kartu item produk di kasir
 *
 * @param {Object} props
 * @param {Object} props.product - Data produk { id, name, category, price, image }
 * @param {Function} props.onAddToCart - Callback saat produk ditambahkan ke keranjang
 */
export default function ProductCard({ product, onAddToCart }) {
  const { name, price, image } = product;

  const formatPrice = (val) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
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
        <img src={image} alt={name} className="product-card-img" />
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
