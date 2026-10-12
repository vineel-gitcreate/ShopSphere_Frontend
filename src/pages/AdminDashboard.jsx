import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  AlertTriangle,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  AlertCircle,
  RefreshCw,
  FolderPlus,
  Search,
  Tag,
  Upload,
  UserCheck,
  UserX,
  Shield,
  FileText,
  Check,
} from "lucide-react";
import api from "../services/api";
import { formatPrice } from "../components/ProductCard";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, products, orders, categories

  // Overview Stats
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Products State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Product Modal (Add / Edit)
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    discountPercentage: 0,
    imageUrl: "",
    categoryId: "",
    stock: 20,
    rating: 4.5,
    featured: false,
  });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Category Modal
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatImg, setNewCatImg] = useState("");

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    discountPercentage: 15,
    minOrderAmount: 499,
    maxDiscountAmount: 500,
    expiryDays: 30,
    active: true,
  });

  // Users State (Task 7)
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Image Upload State (Task 6)
  const [uploadingImage, setUploadingImage] = useState(false);

  // Feedback states
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
  };

  // Load Dashboard Summary
  const loadSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await api.get("/admin/dashboard");
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Load Products & Categories
  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const [prodRes, catRes] = await Promise.all([
        api.get("/products?size=100"),
        api.get("/categories"),
      ]);
      const list = prodRes.data.content || prodRes.data || [];
      setProducts(list);
      setCategories(catRes.data || []);
    } catch (err) {
      showFeedback("error", "Could not fetch products catalog.");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load All Orders
  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await api.get("/admin/orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showFeedback("error", "Could not fetch orders list.");
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load All Coupons
  const loadCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const res = await api.get("/coupons/admin");
      setCoupons(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showFeedback("error", "Could not fetch promotional coupons.");
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Load All Registered Users (Task 7)
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get("/admin/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showFeedback("error", "Could not fetch registered users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadProducts();
    loadOrders();
    loadCoupons();
    loadUsers();
  }, []);

  // Handle User Status Toggle
  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { active: !currentActive });
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
      showFeedback("success", `User status successfully updated to ${!currentActive ? "Active" : "Suspended"}.`);
    } catch (err) {
      showFeedback("error", "Failed to update user account status.");
    }
  };

  // Handle User Role Update
  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
      showFeedback("success", `User role successfully updated to ${newRole}.`);
    } catch (err) {
      showFeedback("error", "Failed to update user role.");
    }
  };

  // Handle Inspect User Order History
  const handleInspectUserOrders = async (userId) => {
    try {
      setLoadingUserDetails(true);
      const res = await api.get(`/admin/users/${userId}`);
      setSelectedUser(res.data);
    } catch (err) {
      showFeedback("error", "Could not retrieve user details or order histories.");
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Handle Image Upload (Task 6)
  const handleProductImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/admin/products/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProductForm((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
      showFeedback("success", "Product image uploaded successfully!");
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Image upload failed. Ensure file is <= 5MB.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle Coupon Create
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim() || !couponForm.discountPercentage) {
      alert("Coupon Code and Discount Percentage are required.");
      return;
    }

    try {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + Number(couponForm.expiryDays || 30));

      await api.post("/coupons/admin", {
        code: couponForm.code.trim().toUpperCase(),
        description: couponForm.description.trim(),
        discountPercentage: Number(couponForm.discountPercentage),
        minOrderAmount: Number(couponForm.minOrderAmount) || 0,
        maxDiscountAmount: couponForm.maxDiscountAmount ? Number(couponForm.maxDiscountAmount) : null,
        expiryDate: expDate.toISOString(),
        active: Boolean(couponForm.active),
      });

      showFeedback("success", `Coupon "${couponForm.code.toUpperCase()}" created!`);
      setCouponModalOpen(false);
      setCouponForm({
        code: "",
        description: "",
        discountPercentage: 15,
        minOrderAmount: 499,
        maxDiscountAmount: 500,
        expiryDays: 30,
        active: true,
      });
      loadCoupons();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to create coupon.");
    }
  };

  const handleToggleCoupon = async (id, code) => {
    try {
      const res = await api.patch(`/coupons/admin/${id}/toggle`);
      setCoupons((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      showFeedback("success", `Coupon "${code}" status updated.`);
    } catch (err) {
      showFeedback("error", "Failed to update coupon status.");
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      await api.delete(`/coupons/admin/${id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      showFeedback("success", `Deleted coupon "${code}".`);
    } catch (err) {
      showFeedback("error", "Failed to delete coupon.");
    }
  };

  // Handle Product Create / Update
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.price) {
      alert("Name and Price are required.");
      return;
    }

    try {
      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : Number(productForm.price),
        discountPercentage: Number(productForm.discountPercentage) || 0,
        imageUrl: productForm.imageUrl.trim() || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
        categoryId: productForm.categoryId ? Number(productForm.categoryId) : null,
        stock: Number(productForm.stock) || 0,
        rating: Number(productForm.rating) || 4.5,
        featured: Boolean(productForm.featured),
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        showFeedback("success", `Product "${payload.name}" updated successfully!`);
      } else {
        await api.post("/products", payload);
        showFeedback("success", `Product "${payload.name}" added to catalog!`);
      }

      setProductModalOpen(false);
      setEditingProduct(null);
      loadProducts();
      loadSummary();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to save product.");
    }
  };

  // Open Edit Modal
  const openEditModal = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      originalPrice: p.originalPrice || p.price,
      discountPercentage: p.discountPercentage || 0,
      imageUrl: p.imageUrl || "",
      categoryId: p.categoryId || (typeof p.category === "object" ? p.category?.id : "") || "",
      stock: p.stock != null ? p.stock : 20,
      rating: p.rating || 4.5,
      featured: p.featured || false,
    });
    setProductModalOpen(true);
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      discountPercentage: 0,
      imageUrl: "",
      categoryId: categories[0]?.id || "",
      stock: 25,
      rating: 4.5,
      featured: false,
    });
    setProductModalOpen(true);
  };

  // Handle Delete Product
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from store catalog?`)) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      showFeedback("success", `Deleted product "${name}".`);
      loadProducts();
      loadSummary();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to delete product.");
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
      showFeedback("success", `Order #${orderId} status changed to ${newStatus}.`);
      loadSummary();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle Category Add
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await api.post("/categories", {
        name: newCatName.trim(),
        description: newCatDesc.trim(),
        imageUrl: newCatImg.trim() || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
      });
      showFeedback("success", `Category "${newCatName}" created!`);
      setNewCatName("");
      setNewCatDesc("");
      setNewCatImg("");
      loadProducts();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to create category.");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <main className="page admin-dashboard-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span className="current">Admin Control Center</span>
        </div>

        <div className="page-header-row">
          <div>
            <h1>Admin Control Center</h1>
            <p className="page-subtitle">
              Manage product catalog, real-time inventory, customer orders, and store KPIs
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              loadSummary();
              loadProducts();
              loadOrders();
            }}
          >
            <RefreshCw size={14} />
            <span>Refresh Data</span>
          </button>
        </div>

        {feedback.message && (
          <div className={feedback.type === "success" ? "success-alert" : "error-alert"}>
            {feedback.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab Navigation Navigation */}
        <div className="admin-tabs-nav">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Store Overview & Analytics
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Products Catalog ({products.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Customer Orders ({orders.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "categories" ? "active" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            Categories ({categories.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "coupons" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("coupons");
              loadCoupons();
            }}
          >
            Promotional Coupons ({coupons.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("users");
              loadUsers();
            }}
          >
            Registered Users ({users.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === "overview" && (
          <div className="admin-tab-content">
            {/* KPI Metric Cards Grid */}
            <div className="metrics-grid">
              <div className="metric-card primary">
                <div className="metric-icon-box">
                  <DollarSign size={24} />
                </div>
                <div>
                  <span className="metric-label">Total Store Revenue</span>
                  <strong className="metric-value">
                    {summary ? formatPrice(summary.totalRevenue) : "₹0.00"}
                  </strong>
                  <small className="metric-sub">Excludes cancelled orders</small>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-box blue">
                  <Package size={24} />
                </div>
                <div>
                  <span className="metric-label">Total Orders Placed</span>
                  <strong className="metric-value">{summary?.totalOrders ?? 0}</strong>
                  <small className="metric-sub">{summary?.pendingOrders ?? 0} pending dispatch</small>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-box green">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <span className="metric-label">Live Catalog Products</span>
                  <strong className="metric-value">{summary?.totalProducts ?? products.length}</strong>
                  <small className="metric-sub">Across {categories.length} active categories</small>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-box purple">
                  <Users size={24} />
                </div>
                <div>
                  <span className="metric-label">Registered Customers</span>
                  <strong className="metric-value">{summary?.totalUsers ?? 0}</strong>
                  <small className="metric-sub">Active platform users</small>
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="admin-panel-card" style={{ marginTop: "30px" }}>
              <div className="card-header-flex">
                <h3>Recent Customer Orders</h3>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setActiveTab("orders")}
                >
                  View All Orders →
                </button>
              </div>

              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(orders.slice(0, 5) || []).map((o) => (
                      <tr key={o.id}>
                        <td>
                          <strong>#{o.id}</strong>
                        </td>
                        <td>
                          <div>{o.fullName}</div>
                          <small className="text-muted">{o.userEmail}</small>
                        </td>
                        <td>{o.items?.length || 1} item(s)</td>
                        <td>
                          <strong>{formatPrice(o.totalAmount)}</strong>
                        </td>
                        <td>
                          <span className={`order-status-badge status-${o.status.toLowerCase()}`}>
                            {o.status}
                          </span>
                        </td>
                        <td>
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="status-select-sm"
                          >
                            <option value="PLACED">PLACED</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                          No orders placed yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGEMENT */}
        {activeTab === "products" && (
          <div className="admin-tab-content">
            <div className="tab-actions-header">
              <div className="search-box-filter">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Filter by title or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={openAddModal}
              >
                <Plus size={16} />
                <span>Add New Product</span>
              </button>
            </div>

            <div className="admin-panel-card">
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock Level</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const catName = p.categoryName || (typeof p.category === "object" ? p.category?.name : "General");
                      const isLowStock = p.stock <= 5;

                      return (
                        <tr key={p.id}>
                          <td>
                            <img
                              src={p.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80"}
                              alt={p.name}
                              className="admin-product-thumb"
                            />
                          </td>
                          <td>
                            <strong>{p.name}</strong>
                            {p.featured && <span className="featured-tag">★ Featured</span>}
                          </td>
                          <td>
                            <span className="category-pill-tag">{catName}</span>
                          </td>
                          <td>
                            <strong>{formatPrice(p.price)}</strong>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <del className="text-muted" style={{ display: "block", fontSize: "11px" }}>
                                {formatPrice(p.originalPrice)}
                              </del>
                            )}
                          </td>
                          <td>
                            <span className={`stock-badge ${isLowStock ? "low" : "ok"}`}>
                              {p.stock} units
                            </span>
                          </td>
                          <td>{p.rating ? Number(p.rating).toFixed(1) : "4.5"} ★</td>
                          <td>
                            <div className="table-actions-cell">
                              <button
                                type="button"
                                className="action-btn edit"
                                onClick={() => openEditModal(p)}
                                title="Edit Product"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                className="action-btn delete"
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                title="Delete Product"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS MANAGEMENT */}
        {activeTab === "orders" && (
          <div className="admin-tab-content">
            <div className="admin-panel-card">
              <div className="card-header-flex">
                <h3>All Customer Orders ({orders.length})</h3>
                <small>Update fulfillment statuses in real-time</small>
              </div>

              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Details</th>
                      <th>Shipping Destination</th>
                      <th>Payment</th>
                      <th>Order Items</th>
                      <th>Total Amount</th>
                      <th>Current Status</th>
                      <th>Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <strong>#{o.id}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""}
                          </div>
                        </td>
                        <td>
                          <div><strong>{o.fullName}</strong></div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{o.userEmail}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{o.phone}</div>
                        </td>
                        <td style={{ maxWidth: "220px", fontSize: "12px" }}>
                          {o.address}, {o.city} - {o.pinCode}
                        </td>
                        <td>
                          <span className="payment-tag">{o.paymentMethod || "COD"}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: "12px" }}>
                            {(o.items || []).map((it, idx) => (
                              <div key={idx}>
                                • {it.productName || "Item"} × {it.quantity}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <strong className="order-price-highlight">
                            {formatPrice(o.totalAmount)}
                          </strong>
                        </td>
                        <td>
                          <span className={`order-status-badge status-${o.status.toLowerCase()}`}>
                            {o.status}
                          </span>
                        </td>
                        <td>
                          <select
                            value={o.status}
                            disabled={updatingOrderId === o.id}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="status-select-sm"
                          >
                            <option value="PLACED">PLACED</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                          No orders in the database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORIES MANAGEMENT */}
        {activeTab === "categories" && (
          <div className="admin-tab-content">
            <div className="categories-management-grid">
              {/* Add Category Form */}
              <div className="admin-panel-card">
                <h3>Add New Category</h3>
                <form onSubmit={handleAddCategory} className="cat-form">
                  <div className="form-group">
                    <label>Category Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Smart Watches"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Modern wrist-worn gadgets"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newCatImg}
                      onChange={(e) => setNewCatImg(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full">
                    <FolderPlus size={16} />
                    <span>Create Category</span>
                  </button>
                </form>
              </div>

              {/* Existing Categories List */}
              <div className="admin-panel-card">
                <h3>Existing Categories ({categories.length})</h3>
                <div className="admin-cat-list">
                  {categories.map((c) => (
                    <div key={c.id || c.name} className="admin-cat-item">
                      <img
                        src={c.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80"}
                        alt={c.name}
                        className="cat-thumb"
                      />
                      <div>
                        <strong>{c.name}</strong>
                        <p>{c.description || "Active Category"}</p>
                      </div>
                      <span className="badge badge-stock ok">
                        {c.productCount != null ? `${c.productCount} products` : "Active"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COUPONS & PROMOTIONS MANAGEMENT */}
        {activeTab === "coupons" && (
          <div className="admin-tab-content">
            <div className="admin-panel-card">
              <div className="card-header-flex">
                <div>
                  <h3>Promotional Coupons & Discount Codes ({coupons.length})</h3>
                  <small>Database-driven promo codes with discount %, minimum spend thresholds & usage limits</small>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setCouponModalOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Plus size={15} />
                  <span>Create New Coupon</span>
                </button>
              </div>

              <div className="admin-table-responsive" style={{ marginTop: "16px" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Coupon Code</th>
                      <th>Description</th>
                      <th>Discount</th>
                      <th>Min Order</th>
                      <th>Max Cap</th>
                      <th>Redemptions</th>
                      <th>Expiry</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span style={{ fontFamily: "monospace", fontWeight: "700", background: "var(--bg-subtle)", padding: "4px 8px", borderRadius: "4px", fontSize: "13px" }}>
                            🏷️ {c.code}
                          </span>
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "200px" }}>
                          {c.description || "Store Promotional Code"}
                        </td>
                        <td>
                          <strong style={{ color: "#10b981", fontSize: "14px" }}>{c.discountPercentage}% OFF</strong>
                        </td>
                        <td>{formatPrice(c.minOrderAmount)}</td>
                        <td>{c.maxDiscountAmount ? formatPrice(c.maxDiscountAmount) : "None"}</td>
                        <td>
                          <span className="badge badge-stock ok">{c.timesUsed || 0} times</span>
                        </td>
                        <td style={{ fontSize: "12px" }}>
                          {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : "Never"}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`btn btn-sm ${c.active ? "btn-primary" : "btn-outline"}`}
                            onClick={() => handleToggleCoupon(c.id, c.code)}
                            style={{ fontSize: "11px", padding: "3px 8px" }}
                          >
                            {c.active ? "Active" : "Disabled"}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-icon danger"
                            onClick={() => handleDeleteCoupon(c.id, c.code)}
                            title="Delete Coupon"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr>
                        <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                          {loadingCoupons ? "Loading coupons..." : "No coupons found in database. Click 'Create New Coupon' to add one."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: REGISTERED USERS MANAGEMENT (Task 7) */}
        {activeTab === "users" && (
          <div className="admin-tab-content">
            <div className="tab-actions-header">
              <div className="search-box-filter">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Filter users by name, email, or city..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span className="badge" style={{ padding: "6px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                  Total Users: {users.length}
                </span>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={loadUsers}
                  disabled={loadingUsers}
                >
                  <RefreshCw size={14} className={loadingUsers ? "spin" : ""} />
                  <span>Refresh Users</span>
                </button>
              </div>
            </div>

            <div className="admin-panel-card">
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Shopper Profile</th>
                      <th>Assigned Role</th>
                      <th>Location</th>
                      <th>Registered</th>
                      <th>Orders Placed</th>
                      <th>Total Spend</th>
                      <th>Account Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter((u) => {
                        const q = userSearch.toLowerCase();
                        return (
                          u.name?.toLowerCase().includes(q) ||
                          u.email?.toLowerCase().includes(q) ||
                          u.city?.toLowerCase().includes(q)
                        );
                      })
                      .map((u) => {
                        const dateFormatted = u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "N/A";

                        return (
                          <tr key={u.id}>
                            <td>
                              <span className="order-id-badge">#{u.id}</span>
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <strong style={{ color: "var(--text-primary)" }}>{u.name}</strong>
                                <small style={{ color: "var(--text-muted)" }}>{u.email}</small>
                                {u.phone && <small style={{ color: "var(--text-muted)" }}>{u.phone}</small>}
                              </div>
                            </td>
                            <td>
                              <span className={`role-badge ${u.role === "ADMIN" ? "admin" : "customer"}`}>
                                {u.role === "ADMIN" ? <Shield size={12} /> : null}
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: "0.88rem" }}>
                                {u.city ? `${u.city} (${u.pinCode || ""})` : "Not provided"}
                              </span>
                            </td>
                            <td>
                              <small style={{ color: "var(--text-muted)" }}>{dateFormatted}</small>
                            </td>
                            <td>
                              <strong>{u.orderCount || 0} orders</strong>
                            </td>
                            <td>
                              <strong style={{ color: "var(--primary)" }}>
                                {formatPrice(u.totalSpent || 0)}
                              </strong>
                            </td>
                            <td>
                              <span className={`status-badge ${u.active ? "delivered" : "cancelled"}`}>
                                {u.active ? "Active" : "Suspended"}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => handleInspectUserOrders(u.id)}
                                  title="View Order History & Details"
                                >
                                  <FileText size={15} />
                                </button>

                                <button
                                  type="button"
                                  className={`btn-icon ${u.active ? "danger" : "success"}`}
                                  onClick={() => handleToggleUserStatus(u.id, u.active)}
                                  title={u.active ? "Suspend User" : "Activate User"}
                                >
                                  {u.active ? <UserX size={15} /> : <UserCheck size={15} />}
                                </button>

                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() =>
                                    handleUpdateUserRole(u.id, u.role === "ADMIN" ? "CUSTOMER" : "ADMIN")
                                  }
                                  title={`Toggle Role to ${u.role === "ADMIN" ? "CUSTOMER" : "ADMIN"}`}
                                >
                                  <Shield size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                    {users.length === 0 && (
                      <tr>
                        <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                          {loadingUsers ? "Loading users directory..." : "No users found in database."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Product Modal (Add / Edit) */}
        {productModalOpen && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setProductModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="modal-form">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Selling Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Original MRP (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.originalPrice}
                      onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Product Image</label>
                  <div className="image-upload-control">
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <input
                        type="url"
                        placeholder="Paste image URL (https://...) or upload file directly"
                        value={productForm.imageUrl}
                        onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                        style={{ flex: 1 }}
                      />
                      <label className="btn btn-outline" style={{ margin: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                        <Upload size={16} />
                        <span>{uploadingImage ? "Uploading..." : "Upload File"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageUpload}
                          disabled={uploadingImage}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>

                    {productForm.imageUrl && (
                      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-card)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <img
                          src={productForm.imageUrl}
                          alt="Product Preview"
                          style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border)" }}
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80";
                          }}
                        />
                        <small style={{ color: "var(--text-muted)" }}>Image preview active: {productForm.imageUrl.length > 50 ? productForm.imageUrl.substring(0, 50) + "..." : productForm.imageUrl}</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Product Description</label>
                  <textarea
                    rows="3"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Discount %</label>
                    <input
                      type="number"
                      value={productForm.discountPercentage}
                      onChange={(e) => setProductForm({ ...productForm, discountPercentage: e.target.value })}
                    />
                  </div>

                  <div className="form-group checkbox-group" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                    <input
                      type="checkbox"
                      id="featCheck"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                    />
                    <label htmlFor="featCheck" style={{ margin: 0 }}>Feature on Homepage</label>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setProductModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? "Save Changes" : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Coupon Creation Modal */}
        {couponModalOpen && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>Create Promotional Coupon</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setCouponModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCoupon} className="modal-form">
                <div className="form-group">
                  <label>Coupon Code * (e.g. FLASH25)</label>
                  <input
                    type="text"
                    required
                    placeholder="FLASH25"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="25% flash discount on orders above ₹999"
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Discount Percentage (1 - 100)% *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={couponForm.discountPercentage}
                      onChange={(e) => setCouponForm({ ...couponForm, discountPercentage: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Min Order Subtotal (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.minOrderAmount}
                      onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Max Discount Cap (₹ optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={couponForm.maxDiscountAmount || ""}
                      onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Validity (Days from today)</label>
                    <input
                      type="number"
                      min="1"
                      value={couponForm.expiryDays}
                      onChange={(e) => setCouponForm({ ...couponForm, expiryDays: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setCouponModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Coupon
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Details & Order History Modal (Task 7) */}
        {selectedUser && (
          <div className="modal-backdrop">
            <div className="modal-card user-history-modal" style={{ maxWidth: "800px" }}>
              <div className="modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Users size={20} />
                  <div>
                    <h3 style={{ margin: 0 }}>Customer Profile & Order History</h3>
                    <small style={{ color: "var(--text-muted)" }}>
                      {selectedUser.user.name} ({selectedUser.user.email})
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedUser(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto", padding: "20px" }}>
                {/* User Stats Card */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                  <div className="metric-card" style={{ padding: "12px 16px" }}>
                    <small className="metric-label">Account Role</small>
                    <strong style={{ fontSize: "1.1rem" }}>{selectedUser.user.role}</strong>
                  </div>
                  <div className="metric-card" style={{ padding: "12px 16px" }}>
                    <small className="metric-label">Account Status</small>
                    <strong style={{ fontSize: "1.1rem", color: selectedUser.user.active ? "var(--success)" : "var(--danger)" }}>
                      {selectedUser.user.active ? "Active" : "Suspended"}
                    </strong>
                  </div>
                  <div className="metric-card" style={{ padding: "12px 16px" }}>
                    <small className="metric-label">Orders Placed</small>
                    <strong style={{ fontSize: "1.1rem" }}>{selectedUser.orders?.length || 0}</strong>
                  </div>
                  <div className="metric-card" style={{ padding: "12px 16px" }}>
                    <small className="metric-label">Total Spent</small>
                    <strong style={{ fontSize: "1.1rem", color: "var(--primary)" }}>
                      {formatPrice(selectedUser.user.totalSpent || 0)}
                    </strong>
                  </div>
                </div>

                <h4 style={{ marginBottom: "12px" }}>Order History ({selectedUser.orders?.length || 0})</h4>
                {selectedUser.orders?.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>
                    No orders placed yet by this customer.
                  </p>
                ) : (
                  <div className="admin-table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Payment</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.orders.map((o) => (
                          <tr key={o.id}>
                            <td><span className="order-id-badge">#{o.id}</span></td>
                            <td>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                            <td>{o.items?.length || 0} items</td>
                            <td>{o.paymentMethod}</td>
                            <td><strong>{formatPrice(o.totalAmount)}</strong></td>
                            <td><span className={`status-badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
