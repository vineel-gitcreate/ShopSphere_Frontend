import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Sparkles,
  Zap,
  TrendingUp,
  Star,
  Tag,
} from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          api.get("/products?size=8"),
          api.get("/categories"),
        ]);

        if (!active) return;

        const prodList = prodRes.data.content || prodRes.data || [];
        setProducts(prodList);
        setCategories(catRes.data || []);
      } catch (err) {
        if (active) {
          setError("Failed to load store data. Please ensure the backend is running.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);
  const displayFeatured = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4);
  const trendingProducts = products.slice(2, 6);

  return (
    <div className="home-page">
      {/* 1. Hero Promotional Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={16} />
              <span>Next-Gen E-Commerce Experience</span>
            </div>

            <h1 className="hero-title">
              Smart Shopping, <br />
              <span className="gradient-text">Elevated For You.</span>
            </h1>

            <p className="hero-subtitle">
              Discover curated luxury essentials across high-performance audio,
              designer apparel, intelligent home tech, and everyday luxury.
              Engineered with transparent pricing and ultra-fast doorstep delivery.
            </p>

            <div className="hero-cta-group">
              <Link to="/products" className="btn btn-primary btn-lg">
                <span>Explore Catalog</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/products?category=Electronics" className="btn btn-secondary btn-lg">
                <span>Trending Tech</span>
              </Link>
            </div>

            <div className="hero-stats-row">
              <div className="hero-stat">
                <strong>50,000+</strong>
                <span>Happy Customers</span>
              </div>
              <div className="stat-divider" />
              <div className="hero-stat">
                <strong>4.9 ★</strong>
                <span>Average Rating</span>
              </div>
              <div className="stat-divider" />
              <div className="hero-stat">
                <strong>100%</strong>
                <span>Genuine Products</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-card">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
                alt="Featured Aura Wireless Headphones"
                className="hero-card-img"
              />
              <div className="hero-floating-glass-tag">
                <div className="glass-icon">
                  <Zap size={20} />
                </div>
                <div>
                  <strong>Aura Pro Wireless</strong>
                  <small>₹2,499 • Active Noise Cancelling</small>
                </div>
              </div>
              <div className="hero-floating-offer-badge">
                <Tag size={16} />
                <span>28% OFF TODAY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trust Badges Strip */}
      <section className="trust-strip">
        <div className="container trust-grid">
          <div className="trust-item">
            <div className="trust-icon-box">
              <Truck size={22} />
            </div>
            <div>
              <strong>Free Express Shipping</strong>
              <small>On all orders above ₹1,999</small>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon-box">
              <RotateCcw size={22} />
            </div>
            <div>
              <strong>7-Day Easy Returns</strong>
              <small>Instant hassle-free refunds</small>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon-box">
              <ShieldCheck size={22} />
            </div>
            <div>
              <strong>100% Verified Quality</strong>
              <small>Authentic manufacturer warranty</small>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-item-last">
              <div className="trust-icon-box">
                <Headphones size={22} />
              </div>
              <div>
                <strong>24/7 Dedicated Support</strong>
                <small>Direct phone & chat assistance</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Categories Showcase */}
      <section className="section categories-section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-eyebrow">Curated Collections</span>
              <h2 className="section-title">Shop by Category</h2>
            </div>
            <Link to="/products" className="view-all-link">
              <span>View All Categories</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="category-grid">
            {categories.map((cat) => (
              <Link
                key={cat.id || cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="category-card"
              >
                <div className="category-img-box">
                  <img
                    src={cat.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"}
                    alt={cat.name}
                    loading="lazy"
                  />
                  <div className="category-overlay">
                    <span className="btn-circle">
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
                <div className="category-info">
                  <h3>{cat.name}</h3>
                  <p>{cat.description || "Discover premium arrivals"}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Featured Products Section */}
      <section className="section featured-section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-eyebrow">Handpicked For You</span>
              <h2 className="section-title">Featured Products</h2>
            </div>
            <Link to="/products" className="view-all-link">
              <span>Browse All ({products.length})</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="product-skeleton-grid">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="skeleton-card" />
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {displayFeatured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Special Promotional Banner */}
      <section className="container promo-banner-container">
        <div className="promo-banner">
          <div className="promo-banner-content">
            <span className="promo-badge">Limited Time Celebration</span>
            <h2>Get Flat ₹500 Off Your First Order</h2>
            <p>
              Use code <strong className="coupon-code">SHOPSPHERE10</strong> at
              checkout to enjoy exclusive welcome savings across all categories.
            </p>
            <div className="promo-actions">
              <Link to="/products" className="btn btn-light btn-lg">
                Shop The Sale Now
              </Link>
            </div>
          </div>
          <div className="promo-shapes">
            <div className="shape shape-1" />
            <div className="shape shape-2" />
          </div>
        </div>
      </section>

      {/* 6. Trending / Best Sellers Section */}
      <section className="section trending-section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-eyebrow">What's Hot</span>
              <h2 className="section-title">Trending Best Sellers</h2>
            </div>
            <Link to="/products?sortBy=rating" className="view-all-link">
              <span>Highest Rated</span>
              <TrendingUp size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="product-skeleton-grid">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="skeleton-card" />
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
