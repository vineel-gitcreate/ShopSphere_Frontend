import { Heart, ShoppingBag, Trash2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Wishlist() {
  const { wishlist, clearWishlist, loadingWishlist } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <main className="page wishlist-page">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span className="current">Wishlist</span>
        </div>

        <div className="page-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1>Saved Wishlist</h1>
            <p className="page-subtitle">
              You have {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved for later purchase
              {isAuthenticated && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginLeft: "12px", color: "var(--primary)", fontSize: "12px", fontWeight: "600" }}>
                  <ShieldCheck size={14} /> Synced to MySQL Account
                </span>
              )}
            </p>
          </div>

          {wishlist.length > 0 && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={clearWishlist}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              title="Remove all items from wishlist"
            >
              <Trash2 size={14} />
              <span>Clear Wishlist</span>
            </button>
          )}
        </div>

        {wishlist.length > 0 ? (
          <div className="product-grid">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state large">
            <div className="empty-icon-circle">
              <Heart size={40} />
            </div>
            <h2>Your Wishlist is Empty</h2>
            <p>
              Tap the heart icon on any product to save it here for later consideration.
            </p>
            <Link to="/products" className="btn btn-primary btn-lg">
              <ShoppingBag size={18} />
              <span>Explore Products</span>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}