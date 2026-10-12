import ProductCard from "./ProductCard";

export default function ProductGrid({ products }) {
  if (!products.length)
    return (
      <div className="empty-state">
        <div className="empty-icon">⌕</div>
        <h3>No products found</h3>
        <p>Try another search term or category.</p>
      </div>
    );

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}