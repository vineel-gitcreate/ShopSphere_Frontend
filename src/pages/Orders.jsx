import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ArrowRight,
  Clock,
  MapPin,
  CreditCard,
  Ban,
  CheckCircle,
  Truck,
  AlertCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import api from "../services/api";
import { formatPrice } from "../components/ProductCard";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/orders");
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not retrieve orders. Please ensure you are logged in."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? The reserved items will be returned to store inventory.")) {
      return;
    }

    try {
      setCancellingId(orderId);
      const response = await api.patch(`/orders/${orderId}/cancel`);
      // Update local order status
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? response.data : o))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      setDownloadingInvoiceId(orderId);
      const response = await api.get(`/orders/${orderId}/invoice`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `ShopSphere-Invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert("Failed to download PDF invoice. Please ensure you are logged in and the server is running.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "PLACED":
        return "status-placed";
      case "CONFIRMED":
        return "status-confirmed";
      case "SHIPPED":
        return "status-shipped";
      case "DELIVERED":
        return "status-delivered";
      case "CANCELLED":
        return "status-cancelled";
      default:
        return "status-default";
    }
  };

  return (
    <main className="page orders-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span className="current">My Orders</span>
        </div>

        <div className="page-header-row">
          <div>
            <h1>Order History</h1>
            <p className="page-subtitle">
              Track delivery progress and review receipts for all your past purchases
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchOrders}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="orders-skeleton-list">
            {[1, 2, 3].map((n) => (
              <div key={n} className="skeleton-order-card" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state large">
            <div className="empty-icon-circle">
              <Package size={40} />
            </div>
            <h2>No Orders Found</h2>
            <p>
              You haven't placed any orders yet. Discover our latest collections and
              treat yourself today!
            </p>
            <Link to="/products" className="btn btn-primary btn-lg">
              <span>Start Shopping</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const canCancel = order.status === "PLACED";

              return (
                <article key={order.id} className="order-history-card">
                  {/* Order Header Strip */}
                  <div className="order-card-header">
                    <div className="order-meta-info">
                      <div className="order-id-badge">
                        <Package size={17} />
                        <strong>Order #{order.id}</strong>
                      </div>
                      <div className="order-date-line">
                        <Clock size={14} />
                        <span>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Recently Placed"}
                        </span>
                      </div>
                    </div>

                    <div className="order-header-right">
                      <span className={`order-status-badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                      <strong className="order-total-amount">
                        {formatPrice(order.totalAmount)}
                      </strong>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="order-items-grid">
                    {(order.items || []).map((item, idx) => (
                      <div key={item.id ?? idx} className="order-item-tile">
                        <img
                          src={
                            item.productImageUrl ||
                            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80"
                          }
                          alt={item.productName || "Product"}
                          className="order-item-thumb"
                        />
                        <div className="order-item-desc">
                          <h4>{item.productName || "Product"}</h4>
                          <span className="order-item-qty">
                            Quantity: <strong>{item.quantity}</strong> × {formatPrice(item.price)}
                          </span>
                        </div>
                        <span className="order-item-subtotal">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer & Delivery Details */}
                  <div className="order-card-footer">
                    <div className="order-shipping-summary">
                      <div className="footer-meta-item">
                        <MapPin size={15} />
                        <span>
                          {order.fullName}, {order.address}, {order.city} - {order.pinCode}
                        </span>
                      </div>
                      <div className="footer-meta-item">
                        <CreditCard size={15} />
                        <span>
                          Payment:{" "}
                          <strong>
                            {order.paymentMethod === "COD"
                              ? "Cash on Delivery"
                              : "Simulated Online Payment"}
                          </strong>
                          {order.paymentStatus && (
                            <span
                              style={{
                                marginLeft: "8px",
                                fontSize: "0.75rem",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                fontWeight: 700,
                                background:
                                  order.paymentStatus === "PAID"
                                    ? "rgba(16, 185, 129, 0.15)"
                                    : order.paymentStatus === "FAILED"
                                    ? "rgba(239, 68, 68, 0.15)"
                                    : "rgba(245, 158, 11, 0.15)",
                                color:
                                  order.paymentStatus === "PAID"
                                    ? "#10b981"
                                    : order.paymentStatus === "FAILED"
                                    ? "#ef4444"
                                    : "#f59e0b",
                              }}
                            >
                              {order.paymentStatus}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="order-action-buttons">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={downloadingInvoiceId === order.id}
                        onClick={() => handleDownloadInvoice(order.id)}
                        title="Download official PDF Tax Invoice"
                      >
                        <FileText size={14} />
                        <span>
                          {downloadingInvoiceId === order.id ? "Generating PDF..." : "Download Invoice"}
                        </span>
                      </button>

                      {canCancel && (
                        <button
                          type="button"
                          className="btn btn-outline btn-danger-outline btn-sm"
                          disabled={cancellingId === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <Ban size={14} />
                          <span>{cancellingId === order.id ? "Cancelling..." : "Cancel Order"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
