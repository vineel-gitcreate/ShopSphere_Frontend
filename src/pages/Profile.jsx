import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Heart,
  ShieldCheck,
  LogOut,
  Save,
  Check,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Profile() {
  const { user, isAdmin, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    pinCode: user?.pinCode || "",
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await api.put("/auth/profile", formData);
      updateUser(response.data);
      setSuccessMsg("Profile updated successfully!");
      setEditMode(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <main className="page">
        <div className="container">
          <div className="empty-state large">
            <h2>Please Sign In</h2>
            <p>You must be signed in to view your profile and manage your orders.</p>
            <Link to="/login" className="btn btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <main className="page profile-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span className="current">My Profile</span>
        </div>

        {/* Profile Header Hero */}
        <div className="profile-banner-card">
          <div className="profile-avatar-large">{initial}</div>
          <div className="profile-hero-info">
            <div className="profile-title-row">
              <h1>{user.name}</h1>
              <span className={`role-badge ${isAdmin ? "admin" : "customer"}`}>
                {isAdmin ? "Administrator" : "Verified Customer"}
              </span>
            </div>
            <p className="profile-email-meta">
              <Mail size={15} />
              <span>{user.email}</span>
            </p>
          </div>

          <div className="profile-hero-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm logout-profile-btn"
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="success-alert">
            <Check size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="error-alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Grid (Personal Info & Address vs Quick Links) */}
        <div className="profile-content-grid">
          {/* Left Column: Editable Details */}
          <div className="profile-card profile-details-card">
            <div className="card-header-flex">
              <div>
                <h2>Personal & Delivery Details</h2>
                <small>Manage your default shipping address and phone number</small>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? "Cancel Editing" : "Edit Profile"}
              </button>
            </div>

            {editMode ? (
              <form onSubmit={handleSaveProfile} className="profile-edit-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Default Delivery Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder="e.g. 42 Palm Avenue, Greenfield Residency"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="city">City & State</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      placeholder="e.g. Bengaluru, Karnataka"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pinCode">PIN Code</label>
                    <input
                      type="text"
                      id="pinCode"
                      name="pinCode"
                      placeholder="e.g. 560001"
                      value={formData.pinCode}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-actions-row">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <Save size={16} />
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info-display">
                <div className="info-row">
                  <span className="info-label">Full Name:</span>
                  <strong className="info-value">{user.name}</strong>
                </div>

                <div className="info-row">
                  <span className="info-label">Email Address:</span>
                  <span className="info-value">{user.email}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Phone Number:</span>
                  <span className="info-value">{user.phone || "Not provided"}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Delivery Address:</span>
                  <span className="info-value">
                    {user.address
                      ? `${user.address}, ${user.city || ""} - ${user.pinCode || ""}`
                      : "No default shipping address saved"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Quick Navigation Tiles */}
          <div className="profile-quick-nav">
            {isAdmin && (
              <Link to="/admin" className="quick-nav-card admin-quick-card">
                <div className="quick-icon-box admin-box">
                  <ShieldAlert size={24} />
                </div>
                <div className="quick-text">
                  <strong>Admin Control Center</strong>
                  <small>Manage store catalog, customer orders & analytics</small>
                </div>
              </Link>
            )}

            <Link to="/orders" className="quick-nav-card">
              <div className="quick-icon-box">
                <Package size={24} />
              </div>
              <div className="quick-text">
                <strong>My Orders</strong>
                <small>View past orders, receipts & delivery status</small>
              </div>
            </Link>

            <Link to="/wishlist" className="quick-nav-card">
              <div className="quick-icon-box">
                <Heart size={24} />
              </div>
              <div className="quick-text">
                <strong>Saved Wishlist</strong>
                <small>Review items you've saved for later purchase</small>
              </div>
            </Link>

            <div className="security-notice-card">
              <ShieldCheck size={20} />
              <div>
                <strong>Account Protected by JWT</strong>
                <small>Session tokens expire automatically after 24 hours.</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
