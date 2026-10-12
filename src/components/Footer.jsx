import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Code,
  ExternalLink,
} from "lucide-react";

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        {/* Brand Column */}
        <div className="footer-col brand-col">
          <Link to="/" className="brand-logo footer-brand">
            <span className="brand-icon">S</span>
            <span className="brand-text light">
              Shop<span className="brand-highlight">Sphere</span>
            </span>
          </Link>
          <p className="footer-about">
            ShopSphere is your premier modern shopping platform delivering
            hand-picked electronics, high-fashion apparel, home essentials, and
            luxury lifestyle gear with guaranteed authenticity.
          </p>

          <div className="footer-contact-items">
            <div className="contact-item">
              <MapPin size={16} />
              <span>Cyber City, Bengaluru, Karnataka, India</span>
            </div>
            <div className="contact-item">
              <Phone size={16} />
              <span>+91 (800) 123-4567 • Mon-Sat 9am-8pm</span>
            </div>
            <div className="contact-item">
              <Mail size={16} />
              <span>support@shopsphere.com</span>
            </div>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer-col">
          <h4>Explore ShopSphere</h4>
          <ul className="footer-links">
            <li><Link to="/">Home Showcase</Link></li>
            <li><Link to="/products">All Products Catalog</Link></li>
            <li><Link to="/products?category=Electronics">Electronics & Audio</Link></li>
            <li><Link to="/products?category=Fashion">Fashion & Apparel</Link></li>
            <li><Link to="/products?category=Home%20%26%20Living">Home & Living</Link></li>
            <li><Link to="/products?category=Beauty">Health & Beauty</Link></li>
          </ul>
        </div>

        {/* Customer Care Column */}
        <div className="footer-col">
          <h4>Customer Care</h4>
          <ul className="footer-links">
            <li><Link to="/profile">My Account</Link></li>
            <li><Link to="/orders">Track Your Orders</Link></li>
            <li><Link to="/wishlist">Saved Wishlist</Link></li>
            <li><Link to="/cart">View Shopping Cart</Link></li>
            <li><a href="#shipping-policy" onClick={(e) => e.preventDefault()}>Shipping & Delivery Policy</a></li>
            <li><a href="#returns-policy" onClick={(e) => e.preventDefault()}>7-Day Return Guarantee</a></li>
            <li>
              <a
                href="http://localhost:8080/swagger-ui/index.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--sky-light)", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}
                title="Explore and test backend REST APIs in Swagger UI"
              >
                <Code size={14} />
                <span>OpenAPI 3 / Swagger Docs</span>
                <ExternalLink size={11} />
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletter & Trust Column */}
        <div className="footer-col">
          <h4>Stay Ahead of Deals</h4>
          <p className="newsletter-desc">
            Subscribe to our weekly VIP newsletter to receive exclusive discounts,
            flash sale alerts, and curated product recommendations.
          </p>

          {subscribed ? (
            <div className="newsletter-success">
              <CheckCircle size={18} />
              <span>You're subscribed! Check your inbox soon.</span>
            </div>
          ) : (
            <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Newsletter email"
              />
              <button type="submit" aria-label="Subscribe">
                <ArrowRight size={17} />
              </button>
            </form>
          )}

          <div className="security-badge-card">
            <ShieldCheck size={24} className="shield-icon" />
            <div>
              <strong>100% Secure Checkout</strong>
              <small>256-bit SSL encryption & verified payments</small>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} ShopSphere Technologies Inc. Built with Spring Boot 3, React & MySQL.</p>
          <div className="payment-icons-strip">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>RuPay</span>
            <span>UPI</span>
            <span>NetBanking</span>
            <span>COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}