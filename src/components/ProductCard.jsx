import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, ShoppingBag, Check } from "lucide-react";
import { useCart } from "../context/CartContext";

export function formatPrice(amount) {
  if (amount == null) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category || "ShopSphere";

  const discount =
    product.discountPercentage ||
    (product.originalPrice && product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : null);

  return (
    <article className="product-card" id={`product-${product.id}`}>
      <Link to={`/products/${product.id}`} className="product-card-link">
        <div className="product-image-container">
          <img
            src={product.imageUrl || product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"}
            alt={product.name}
            loading="lazy"
            className="product-thumbnail"
          />

          {discount > 0 && (
            <span className="badge badge-discount">{discount}% OFF</span>
          )}

          {isOutOfStock ? (
            <span className="badge badge-stock out">Out of Stock</span>
          ) : isLowStock ? (
            <span className="badge badge-stock low">Only {product.stock} Left!</span>
          ) : null}

          <button
            type="button"
            className={`wish-btn ${inWishlist ? "active" : ""}`}
            onClick={handleWishlistToggle}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={16} fill={inWishlist ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="product-body">
          <span className="product-category-label">{categoryName}</span>
          <h3 className="product-title" title={product.name}>
            {product.name}
          </h3>

          <div className="product-rating-row">
            <div className="stars-wrapper">
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <span className="rating-score">{product.rating ? Number(product.rating).toFixed(1) : "4.5"}</span>
            </div>
            <span className="review-count">({product.reviewCount || 120} reviews)</span>
          </div>

          <div className="product-price-row">
            <span className="current-price">{formatPrice(product.price)}</span>
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <del className="original-price">{formatPrice(product.originalPrice)}</del>
            )}
          </div>
        </div>
      </Link>

      <div className="product-card-actions">
        <button
          type="button"
          className={`add-btn ${added ? "added" : ""}`}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label={`Add ${product.name} to cart`}
        >
          {added ? (
            <>
              <Check size={16} /> Added to Cart
            </>
          ) : isOutOfStock ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingBag size={15} /> Add to Cart
            </>
          )}
        </button>
      </div>
    </article>
  );
}
