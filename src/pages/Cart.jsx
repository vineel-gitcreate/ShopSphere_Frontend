import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Check,
  RotateCcw,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../components/ProductCard";

export default function Cart() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    shipping,
    discount,
    total,
    appliedCoupon,
    activeCoupons,
    applyCouponCode,
    removeCoupon,
  } = useCart();
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState(appliedCoupon ? appliedCoupon.code : "");
  const [promoMessage, setPromoMessage] = useState(appliedCoupon?.message || "");
  const [promoError, setPromoError] = useState("");
  const [applying, setApplying] = useState(false);

  const handleApplyPromo = async (e, codeToApply) => {
    if (e) e.preventDefault();
    const code = (codeToApply || promoCode).trim();
    if (!code) {
      setPromoError("Please enter a promo code.");
      return;
    }
    setPromoError("");
    setPromoMessage("");
    setApplying(true);

    try {
      const res = await applyCouponCode(code);
      if (res.valid) {
        setPromoMessage(res.message);
        setPromoCode(res.code);
      } else {
        setPromoError(res.message || "Invalid coupon code.");
      }
    } finally {
      setApplying(false);
    }
  };

  const handleRemovePromo = () => {
    removeCoupon();
    setPromoCode("");
    setPromoMessage("");
    setPromoError("");
  };

  const finalTotal = total;

  if (cart.length === 0) {
    return (
      <main className="page cart-page">
        <div className="container">
          <div className="empty-state large">
            <div className="empty-icon-circle">
              <ShoppingBag size={40} />
            </div>
            <h2>Your Shopping Cart is Empty</h2>
            <p>
              Looks like you haven't added any products to your cart yet. Explore our
              curated catalog to find top-rated gear and styles.
            </p>
            <Link to="/products" className="btn btn-primary btn-lg">
              <span>Start Shopping</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page cart-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span className="current">Shopping Cart</span>
        </div>

        <div className="page-header-row">
          <div>
            <h1>Shopping Cart</h1>
            <p className="page-subtitle">
              You have {cart.reduce((s, i) => s + (i.quantity || 1), 0)} items in your cart
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={clearCart}
          >
            <Trash2 size={15} />
            <span>Clear Cart</span>
          </button>
        </div>

        {/* Cart Grid (Items on Left + Summary on Right) */}
        <div className="cart-layout">
          {/* Cart Items List */}
          <div className="cart-items-column">
            <div className="cart-items-card">
              {cart.map((item) => (
                <article key={item.id} className="cart-item-row">
                  <Link to={`/products/${item.id}`} className="cart-item-image-box">
                    <img
                      src={item.imageUrl || item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80"}
                      alt={item.name}
                    />
                  </Link>

                  <div className="cart-item-details">
                    <Link to={`/products/${item.id}`} className="cart-item-title">
                      {item.name}
                    </Link>

                    <div className="cart-item-unit-price">
                      Unit Price: <strong>{formatPrice(item.price)}</strong>
                    </div>

                    <div className="cart-item-controls">
                      {/* Quantity Controls */}
                      <div className="quantity-counter mini">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="qty-number">{item.quantity || 1}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                          disabled={item.stock && item.quantity >= item.stock}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        className="cart-remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 size={15} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-line-total">
                    <span>Subtotal:</span>
                    <strong>{formatPrice(item.price * (item.quantity || 1))}</strong>
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-bottom-actions">
              <Link to="/products" className="btn btn-outline">
                <RotateCcw size={16} />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>

          {/* Cart Summary Card */}
          <aside className="cart-summary-column">
            {/* Promo Code Box */}
            <div className="summary-card promo-card">
              <h3>Have a Promo Code?</h3>

              {appliedCoupon && appliedCoupon.valid ? (
                <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "var(--radius-sm)", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <strong style={{ color: "#10b981", display: "block", fontSize: "14px" }}>
                      🏷️ {appliedCoupon.code} Applied
                    </strong>
                    <small style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                      {appliedCoupon.discountPercentage}% OFF (Saved {formatPrice(discount)})
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: "11px", padding: "4px 8px" }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="promo-form">
                  <div className="promo-input-group">
                    <Tag size={16} />
                    <input
                      type="text"
                      placeholder="e.g. SHOPSPHERE10"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button type="submit" disabled={applying}>
                      {applying ? "Checking..." : "Apply"}
                    </button>
                  </div>
                  {promoMessage && (
                    <p className="promo-msg success">
                      <Check size={14} /> {promoMessage}
                    </p>
                  )}
                  {promoError && <p className="promo-msg error">{promoError}</p>}
                </form>
              )}

              {/* Available database deals */}
              {activeCoupons && activeCoupons.length > 0 && (
                <div style={{ marginTop: "14px", borderTop: "1px dashed var(--border)", paddingTop: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Available Store Offers:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {activeCoupons.map((c) => (
                      <button
                        key={c.id || c.code}
                        type="button"
                        onClick={() => handleApplyPromo(null, c.code)}
                        style={{
                          background: appliedCoupon?.code === c.code ? "var(--primary-subtle)" : "var(--surface)",
                          border: `1px solid ${appliedCoupon?.code === c.code ? "var(--primary)" : "var(--border)"}`,
                          color: appliedCoupon?.code === c.code ? "var(--primary)" : "var(--text-heading)",
                          borderRadius: "4px",
                          fontSize: "11px",
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                        title={c.description || `${c.discountPercentage}% off`}
                      >
                        ⚡ {c.code} ({c.discountPercentage}%)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order Cost Breakdown */}
            <div className="summary-card">
              <h3>Order Summary</h3>

              <div className="summary-line">
                <span>Cart Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              {discount > 0 && (
                <div className="summary-line discount-line">
                  <span>Coupon Discount ({appliedCoupon?.code || "Promo"} – {appliedCoupon?.discountPercentage}%)</span>
                  <strong>–{formatPrice(discount)}</strong>
                </div>
              )}

              <div className="summary-line">
                <span>Shipping Charges</span>
                <strong>
                  {shipping === 0 ? (
                    <span className="free-shipping-tag">FREE</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </strong>
              </div>

              {subtotal < 1999 && subtotal > 0 && (
                <div className="shipping-progress-notice">
                  <span>
                    Add <strong>{formatPrice(1999 - subtotal)}</strong> more for FREE shipping!
                  </span>
                </div>
              )}

              <hr className="summary-divider" />

              <div className="summary-line total-line">
                <span>Estimated Total</span>
                <strong className="final-total-amount">{formatPrice(finalTotal)}</strong>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-full checkout-cta-btn"
                onClick={() => navigate("/checkout")}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>

              <div className="summary-trust-notice">
                <ShieldCheck size={16} />
                <span>Safe & Secure 256-Bit SSL Encrypted Checkout</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}