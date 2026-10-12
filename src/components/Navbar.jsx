import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Heart,
  User,
  ShieldAlert,
  Package,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import SearchBar from "./SearchBar";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount, wishlistCount } = useCart();
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setAccountDropdownOpen(false);
    navigate("/");
  };

  return (
    <header className="site-header">
      {/* Top Banner Strip */}
      <div className="top-announcement-strip">
        <div className="container announcement-content">
          <span>🚀 Free Express Shipping on Orders Over ₹1,999</span>
          <span className="dot-sep">•</span>
          <span>✨ 100% Genuine Certified Products</span>
          <span className="dot-sep">•</span>
          <span>🛡️ Easy 7-Day Hassle-Free Returns</span>
          <span className="dot-sep">•</span>
          <a
            href="http://localhost:8080/swagger-ui/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="announcement-swagger-link"
            title="Open Interactive Backend API Documentation (OpenAPI 3 / Swagger)"
          >
            ⚡ Swagger API Docs ↗
          </a>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="navbar container">
        <div className="nav-left">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <span className="brand-icon">S</span>
            <span className="brand-text">
              Shop<span className="brand-highlight">Sphere</span>
            </span>
          </Link>
        </div>

        {/* Center Search Bar */}
        <div className="nav-center">
          <SearchBar />
        </div>

        {/* Right Navigation Actions */}
        <div className="nav-actions">
          {/* Wishlist */}
          <Link to="/wishlist" className="nav-action-item" title="Saved Wishlist">
            <div className="icon-badge-wrapper">
              <Heart size={21} />
              {wishlistCount > 0 && <span className="counter-badge">{wishlistCount}</span>}
            </div>
            <span className="action-text">Wishlist</span>
          </Link>

          {/* Cart */}
          <Link to="/cart" className="nav-action-item cart-action" title="Shopping Cart">
            <div className="icon-badge-wrapper">
              <ShoppingBag size={21} />
              {cartCount > 0 && <span className="counter-badge cart-badge">{cartCount}</span>}
            </div>
            <span className="action-text">Cart</span>
          </Link>

          {/* Theme Switcher Button */}
          <button
            type="button"
            className="nav-action-item theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle light and dark theme"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <div className="icon-badge-wrapper theme-icon-spin">
              {isDark ? <Sun size={21} className="theme-sun-icon" /> : <Moon size={21} className="theme-moon-icon" />}
            </div>
            <span className="action-text">{isDark ? "Light" : "Dark"}</span>
          </button>

          {/* User Account / Auth */}
          {isAuthenticated ? (
            <div className="account-dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className="nav-action-item account-btn"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                aria-expanded={accountDropdownOpen}
              >
                <div className="user-avatar-mini">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="account-meta">
                  <span className="action-text user-greeting">
                    {user?.name ? user.name.split(" ")[0] : "Account"}
                  </span>
                  <span className="user-role-tag">{isAdmin ? "Admin" : "Customer"}</span>
                </div>
                <ChevronDown size={14} className="dropdown-arrow" />
              </button>

              {accountDropdownOpen && (
                <div className="account-dropdown-menu">
                  <div className="dropdown-user-header">
                    <strong>{user?.name}</strong>
                    <small>{user?.email}</small>
                  </div>

                  <hr className="dropdown-divider" />

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="dropdown-link admin-highlight"
                      onClick={() => setAccountDropdownOpen(false)}
                    >
                      <ShieldAlert size={16} />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    className="dropdown-link"
                    onClick={() => setAccountDropdownOpen(false)}
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/orders"
                    className="dropdown-link"
                    onClick={() => setAccountDropdownOpen(false)}
                  >
                    <Package size={16} />
                    <span>My Orders</span>
                  </Link>

                  <hr className="dropdown-divider" />

                  <button
                    type="button"
                    className="dropdown-link logout-btn"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="nav-action-item login-btn-link">
              <User size={21} />
              <span className="action-text">Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Secondary Categories Bar */}
      <nav className={`category-nav-strip ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="container cat-nav-inner">
          <NavLink to="/" onClick={() => setMobileMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/products" onClick={() => setMobileMenuOpen(false)}>
            All Products
          </NavLink>
          <NavLink to="/products?category=Electronics" onClick={() => setMobileMenuOpen(false)}>
            Electronics
          </NavLink>
          <NavLink to="/products?category=Fashion" onClick={() => setMobileMenuOpen(false)}>
            Fashion
          </NavLink>
          <NavLink to="/products?category=Home%20%26%20Living" onClick={() => setMobileMenuOpen(false)}>
            Home & Living
          </NavLink>
          <NavLink to="/products?category=Beauty" onClick={() => setMobileMenuOpen(false)}>
            Beauty
          </NavLink>
          <NavLink to="/products?category=Sports" onClick={() => setMobileMenuOpen(false)}>
            Sports
          </NavLink>
          <NavLink to="/products?category=Accessories" onClick={() => setMobileMenuOpen(false)}>
            Accessories
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className="admin-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Panel
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}