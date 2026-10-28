import ProductCard from '../ProductCard/ProductCard';
import './ProductGrid.css';

/**
 * ProductGrid component
 * Merender kumpulan ProductCard dalam layout grid
 *
 * @param {Object} props
 * @param {Array} props.products - Daftar produk
 * @param {Function} props.onAddToCart - Callback saat item produk dipilih
 */
export default function ProductGrid({ products = [], onAddToCart }) {
  if (products.length === 0) {
    return (
      <div className="product-grid-empty">
        <p>Menu tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
