import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Truck,
  ArrowLeft,
  PackageCheck,
  AlertCircle,
  Banknote,
  FileText,
  Zap,
  ExternalLink,
  X,
  Lock,
  ShieldAlert,
  Smartphone,
  Building2,
  RefreshCw,
  XCircle,
  Info,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../components/ProductCard";
import api from "../services/api";

export default function Checkout() {
  const { cart, subtotal, shipping, discount, total, clearCart, appliedCoupon } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    pinCode: "",
    paymentMethod: "COD",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  // Simulated payment state
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [simulatedModalOpen, setSimulatedModalOpen] = useState(false);
  const [gatewaySession, setGatewaySession] = useState(null);
  const [simulationFailure, setSimulationFailure] = useState(null);
  const [selectedDemoMethod, setSelectedDemoMethod] = useState("card");
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const handleDownloadPlacedInvoice = async () => {
    if (!placedOrder?.id) return;
    try {
      setDownloadingInvoice(true);
      const response = await api.get(`/orders/${placedOrder.id}/invoice`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `ShopSphere-Invoice-${placedOrder.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert("Failed to download invoice. You can also download it anytime from the Orders page.");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Auto-fill form from user profile if available
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        phone: prev.phone || user.phone || "",
        address: prev.address || user.address || "",
        city: prev.city || user.city || "",
        pinCode: prev.pinCode || user.pinCode || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSimulatePayment = async (outcome) => {
    if (!gatewaySession?.order?.id) return;
    try {
      setVerifyingPayment(true);
      setError("");
      setSimulationFailure(null);

      const response = await api.post("/payments/simulate", {
        orderId: Number(gatewaySession.order.id),
        outcome: outcome,
        failureReason: outcome === "FAILURE" ? "Simulated payment declined by user for demonstration." : null,
      });

      if (outcome === "SUCCESS") {
        // Refetch confirmed order with updated payment status and simulated transaction ID
        const updatedRes = await api.get(`/orders/${gatewaySession.order.id}`);
        setPlacedOrder(updatedRes.data);
        clearCart();
        setSimulatedModalOpen(false);
        setGatewaySession(null);
      } else {
        // Record failure outcome in modal without duplicate order or stock deduction
        setSimulationFailure({
          message: response.data.message || "Simulated payment declined as requested for demonstration.",
          paymentStatus: "FAILED",
        });
      }
    } catch (err) {
      setSimulationFailure({
        message: err.response?.data?.message || "Failed to process payment simulation with server.",
        paymentStatus: "FAILED",
      });
    } finally {
      setVerifyingPayment(false);
      setLoading(false);
    }
  };

  const handleCancelFailedOrder = async () => {
    if (!gatewaySession?.order?.id) return;
    try {
      setCancellingOrder(true);
      await api.patch(`/orders/${gatewaySession.order.id}/cancel`);
      setSimulatedModalOpen(false);
      setSimulationFailure(null);
      setGatewaySession(null);
      setError(`Order #${gatewaySession.order.id} was cancelled and reserved stock was restored.`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancellingOrder(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError("");

    if (!isAuthenticated) {
      setError("Please sign in or register to place your order.");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    if (cart.length === 0) {
      setError("Your shopping cart is empty.");
      return;
    }

    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim() || !form.pinCode.trim()) {
      setError("Please fill out all required shipping address fields.");
      return;
    }

    setLoading(true);

    // Flow 1: Cash on Delivery (Preserved 100%)
    if (form.paymentMethod === "COD") {
      try {
        const orderPayload = {
          items: cart.map((item) => ({
            productId: Number(item.id),
            quantity: Number(item.quantity || 1),
          })),
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          pinCode: form.pinCode.trim(),
          paymentMethod: "COD",
          couponCode: appliedCoupon?.valid ? appliedCoupon.code : null,
        };

        const response = await api.post("/orders", orderPayload);
        setPlacedOrder(response.data);
        clearCart();
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to place order. Please review your details and try again.";
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Flow 2: Simulated Online Payment (Card / UPI / NetBanking)
    try {
      const orderPayload = {
        items: cart.map((item) => ({
          productId: Number(item.id),
          quantity: Number(item.quantity || 1),
        })),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        pinCode: form.pinCode.trim(),
        paymentMethod: "ONLINE",
        couponCode: appliedCoupon?.valid ? appliedCoupon.code : null,
      };

      const orderRes = await api.post("/orders", orderPayload);
      const createdOrder = orderRes.data;

      const paySessionRes = await api.post("/payments/create-order", {
        orderId: createdOrder.id,
        amount: createdOrder.totalAmount,
        currency: "INR",
      });
      const sessionData = paySessionRes.data;

      setGatewaySession({ order: createdOrder, session: sessionData });
      setSimulationFailure(null);
      setSimulatedModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate simulated payment session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If order was successfully placed
  if (placedOrder) {
    return (
      <main className="page checkout-success-page">
        <div className="container">
          <div className="order-success-card">
            <div className="success-icon-badge">
              <CheckCircle2 size={54} />
            </div>

            <h1>Order Confirmed!</h1>
            <p className="success-subtitle">
              Thank you for shopping with ShopSphere. Your order has been placed and is being prepared.
            </p>

            <div className="order-receipt-box">
              <div className="receipt-row">
                <span>Order Reference:</span>
                <strong>#{placedOrder.id}</strong>
              </div>
              <div className="receipt-row">
                <span>Payment Method:</span>
                <strong>{placedOrder.paymentMethod === "COD" ? "Cash on Delivery" : "Simulated Online Payment"}</strong>
              </div>
              <div className="receipt-row">
                <span>Payment Status:</span>
                <span className={`status-badge ${placedOrder.paymentStatus === "PAID" ? "delivered" : "placed"}`}>
                  {placedOrder.paymentStatus || (placedOrder.paymentMethod === "COD" ? "PENDING (ON DELIVERY)" : "PAID")}
                </span>
              </div>
              {placedOrder.razorpayPaymentId && (
                <div className="receipt-row">
                  <span>Simulated Transaction ID:</span>
                  <code style={{ color: "var(--primary)", fontWeight: 600 }}>{placedOrder.razorpayPaymentId}</code>
                </div>
              )}
              <div className="receipt-row">
                <span>Order Status:</span>
                <span className="status-badge placed">{placedOrder.status}</span>
              </div>
              <div className="receipt-row">
                <span>Shipping To:</span>
                <span>{placedOrder.fullName}, {placedOrder.city} - {placedOrder.pinCode}</span>
              </div>
              <hr className="receipt-divider" />
              <div className="receipt-row total">
                <span>Total Amount Paid:</span>
                <strong className="receipt-total-price">{formatPrice(placedOrder.totalAmount)}</strong>
              </div>
            </div>

            <div className="success-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => navigate("/orders")}
              >
                <PackageCheck size={18} />
                <span>View Order Status</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={handleDownloadPlacedInvoice}
                disabled={downloadingInvoice}
              >
                <FileText size={18} />
                <span>{downloadingInvoice ? "Generating PDF..." : "Download PDF Invoice"}</span>
              </button>
              <Link to="/products" className="btn btn-outline btn-lg">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // If cart is empty
  if (cart.length === 0) {
    return (
      <main className="page">
        <div className="container">
          <div className="empty-state large">
            <h2>Your Cart is Empty</h2>
            <p>You cannot proceed to checkout without adding products to your cart.</p>
            <Link to="/products" className="btn btn-primary">
              <ArrowLeft size={16} /> Explore Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page checkout-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/cart">Cart</Link>
          <span>/</span>
          <span className="current">Checkout</span>
        </div>

        <h1 className="page-title-main">Secure Checkout</h1>

        {error && (
          <div className="error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="checkout-layout">
          {/* Left Column: Delivery & Payment Details */}
          <div className="checkout-form-column">
            {/* Step 1: Shipping Address */}
            <section className="checkout-card">
              <div className="checkout-card-header">
                <div className="step-number">1</div>
                <div>
                  <h2>Shipping & Delivery Address</h2>
                  <small>Where should we deliver your order?</small>
                </div>
              </div>

              <div className="checkout-form-grid">
                <div className="form-group full-width">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="e.g. John Doe"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="e.g. +91 98765 43210"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pinCode">PIN / Postal Code *</label>
                  <input
                    type="text"
                    id="pinCode"
                    name="pinCode"
                    placeholder="e.g. 560001"
                    value={form.pinCode}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Street Address / House No. *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder="e.g. Flat 402, Skyline Residency, 12th Cross"
                    value={form.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="city">City & State *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    placeholder="e.g. Bengaluru, Karnataka"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Step 2: Payment Method */}
            <section className="checkout-card">
              <div className="checkout-card-header">
                <div className="step-number">2</div>
                <div>
                  <h2>Payment Method</h2>
                  <small>Select your preferred payment method</small>
                </div>
              </div>

              <div className="payment-options-list">
                <label className={`payment-method-tile ${form.paymentMethod === "COD" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={form.paymentMethod === "COD"}
                    onChange={handleChange}
                  />
                  <div className="payment-tile-icon">
                    <Banknote size={22} />
                  </div>
                  <div className="payment-tile-info">
                    <strong>Cash on Delivery (COD)</strong>
                    <small>Pay with cash or UPI QR upon delivery at your doorstep.</small>
                  </div>
                  <span className="recommended-badge">Recommended</span>
                </label>

                <label className={`payment-method-tile ${form.paymentMethod === "ONLINE" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ONLINE"
                    checked={form.paymentMethod === "ONLINE"}
                    onChange={handleChange}
                  />
                  <div className="payment-tile-icon" style={{ background: "rgba(79, 70, 229, 0.1)", color: "#4f46e5" }}>
                    <CreditCard size={22} />
                  </div>
                  <div className="payment-tile-info">
                    <strong>Simulated Online Payment (Card / UPI / NetBanking)</strong>
                    <small>Safe academic simulation sandbox with server validation (No real money).</small>
                  </div>
                  <span className="recommended-badge" style={{ background: "#4f46e5", color: "#fff" }}>Demo Simulator</span>
                </label>
              </div>
            </section>
          </div>

          {/* Right Column: Order Review & Submit */}
          <aside className="checkout-summary-column">
            <div className="summary-card">
              <h3>Order Review ({cart.length} items)</h3>

              <div className="checkout-items-preview">
                {cart.map((item) => (
                  <div key={item.id} className="checkout-item-mini">
                    <img
                      src={item.imageUrl || item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80"}
                      alt={item.name}
                    />
                    <div className="mini-item-info">
                      <span className="mini-title">{item.name}</span>
                      <small>Qty: {item.quantity || 1}</small>
                    </div>
                    <span className="mini-price">
                      {formatPrice(item.price * (item.quantity || 1))}
                    </span>
                  </div>
                ))}
              </div>

              <hr className="summary-divider" />

              <div className="summary-line">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <div className="summary-line">
                <span>Shipping Charges</span>
                <strong>
                  {shipping === 0 ? <span className="free-shipping-tag">FREE</span> : formatPrice(shipping)}
                </strong>
              </div>

              {discount > 0 && (
                <div className="summary-line discount-line" style={{ color: "#10b981" }}>
                  <span>Promo Discount ({appliedCoupon?.code || "Coupon"})</span>
                  <strong>–{formatPrice(discount)}</strong>
                </div>
              )}

              <hr className="summary-divider" />

              <div className="summary-line total-line">
                <span>Total Payable</span>
                <strong className="final-total-amount">{formatPrice(total)}</strong>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full checkout-submit-btn"
                disabled={loading}
              >
                {loading ? "Placing Order..." : `Confirm Order (${formatPrice(total)})`}
              </button>

              <div className="summary-trust-notice">
                <ShieldCheck size={16} />
                <span>Instant Confirmation & Real-Time Stock Reservation</span>
              </div>
            </div>
          </aside>
        </form>
      </div>

      {/* Simulated Online Payment Interactive Modal */}
      {simulatedModalOpen && gatewaySession && (
        <div className="modal-backdrop">
          <div className="modal-card simulated-payment-modal">
            <div className="sim-modal-header">
              <div className="sim-header-title">
                <div className="sim-header-icon">
                  <CreditCard size={20} />
                </div>
                <div className="sim-header-text">
                  <h3>ShopSphere Payment Simulator</h3>
                  <small>Order #{gatewaySession.order.id} • Session {gatewaySession.session.razorpayOrderId}</small>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  if (simulationFailure) {
                    setSimulatedModalOpen(false);
                    setLoading(false);
                  } else if (window.confirm("Close simulated payment window? Order #" + gatewaySession.order.id + " will remain unconfirmed in your order history.")) {
                    setSimulatedModalOpen(false);
                    setLoading(false);
                  }
                }}
                style={{ color: "#fff", background: "transparent", border: "none", cursor: "pointer" }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="sim-modal-body">
              {/* Mandatory Notice Banner */}
              <div className="sim-notice-banner">
                <ShieldAlert size={22} style={{ flexShrink: 0, marginTop: "2px", color: "#d97706" }} />
                <div>
                  <strong>Simulated Payment — No Real Money</strong>
                  <span>This is a safe educational demonstration environment. No real funds are transferred. Real card numbers, CVVs, UPI PINs, or banking passwords are never requested or processed.</span>
                </div>
              </div>

              {/* Order Amount Display */}
              <div className="sim-amount-card">
                <div className="sim-amount-label">Amount Payable</div>
                <div className="sim-amount-value">
                  {formatPrice(gatewaySession.order.totalAmount)}
                </div>
                <div className="sim-meta-strip">
                  <span>Customer: <strong>{gatewaySession.order.fullName}</strong></span>
                  <span>•</span>
                  <span>Order: <strong>#{gatewaySession.order.id}</strong></span>
                  <span>•</span>
                  <span>Mode: <strong>Demo Sandbox</strong></span>
                </div>
              </div>

              {/* Failure State Display */}
              {simulationFailure ? (
                <div className="sim-failure-state-card">
                  <XCircle size={36} color="#ef4444" />
                  <h4>Simulated Payment Declined</h4>
                  <p>{simulationFailure.message}</p>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Order #{gatewaySession.order.id} payment status is recorded as <strong>FAILED</strong> in MySQL. Stock reservation remains intact. No duplicate orders were created.
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "8px", marginTop: "12px" }}>
                    <button
                      type="button"
                      className="btn-sim-success"
                      disabled={verifyingPayment}
                      onClick={() => handleSimulatePayment("SUCCESS")}
                    >
                      <RefreshCw size={17} className={verifyingPayment ? "spin" : ""} />
                      <span>{verifyingPayment ? "Processing..." : "Retry Simulation: Complete as SUCCESS"}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={cancellingOrder}
                      onClick={handleCancelFailedOrder}
                      style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
                    >
                      <X size={16} />
                      <span>{cancellingOrder ? "Cancelling Order..." : "Cancel Order & Restock Items"}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setSimulatedModalOpen(false);
                        navigate("/orders");
                      }}
                    >
                      <span>View in Order History</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Visual Method Selector */}
                  <div>
                    <div className="sim-method-selector-title">Select Simulated Test Method</div>
                    <div className="sim-methods-grid">
                      <button
                        type="button"
                        className={`sim-method-btn ${selectedDemoMethod === "card" ? "active" : ""}`}
                        onClick={() => setSelectedDemoMethod("card")}
                      >
                        <CreditCard size={20} color="#6366f1" />
                        <span>Simulated Card</span>
                        <small>•••• 4242</small>
                      </button>

                      <button
                        type="button"
                        className={`sim-method-btn ${selectedDemoMethod === "upi" ? "active" : ""}`}
                        onClick={() => setSelectedDemoMethod("upi")}
                      >
                        <Smartphone size={20} color="#10b981" />
                        <span>Simulated UPI</span>
                        <small>demo@upi</small>
                      </button>

                      <button
                        type="button"
                        className={`sim-method-btn ${selectedDemoMethod === "netbanking" ? "active" : ""}`}
                        onClick={() => setSelectedDemoMethod("netbanking")}
                      >
                        <Building2 size={20} color="#f59e0b" />
                        <span>Net Banking</span>
                        <small>Demo Bank</small>
                      </button>
                    </div>
                  </div>

                  <div className="sim-method-detail-box">
                    <span>
                      {selectedDemoMethod === "card" && "💳 Virtual Visa •••• 4242 (Demo Sandbox Account)"}
                      {selectedDemoMethod === "upi" && "📱 Virtual VPA demo@shopsphere (Simulated Fast UPI)"}
                      {selectedDemoMethod === "netbanking" && "🏛️ ShopSphere Sandbox Bank (Demo Corporate Gateway)"}
                    </span>
                    <span className="badge" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1", fontSize: "0.72rem", padding: "2px 6px", borderRadius: "4px" }}>
                      Safe Test Mode
                    </span>
                  </div>

                  {/* Dual Demonstration Outcome Buttons */}
                  <div className="sim-actions-container">
                    <button
                      type="button"
                      className="btn-sim-success"
                      disabled={verifyingPayment}
                      onClick={() => handleSimulatePayment("SUCCESS")}
                    >
                      <CheckCircle2 size={19} />
                      <span>{verifyingPayment ? "Authorizing Simulated Payment..." : "Simulate Payment SUCCESS"}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-sim-fail"
                      disabled={verifyingPayment}
                      onClick={() => handleSimulatePayment("FAILURE")}
                    >
                      <XCircle size={19} />
                      <span>{verifyingPayment ? "Simulating Gateway Response..." : "Simulate Payment FAILURE (Test Decline)"}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={verifyingPayment}
                      onClick={() => {
                        setSimulatedModalOpen(false);
                        setLoading(false);
                      }}
                      style={{ marginTop: "4px" }}
                    >
                      Cancel Simulation Window
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
