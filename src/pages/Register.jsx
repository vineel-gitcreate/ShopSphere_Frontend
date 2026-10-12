import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Please fill out all required fields.");
      return;
    }

    if (form.name.trim().length < 2) {
      setError("Full name must be at least 2 characters long.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      const { token, user } = response.data;
      if (token && user) {
        login(user, token);
        navigate("/", { replace: true });
      } else {
        navigate("/login");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.details?.email ||
        err.response?.data?.details?.password ||
        "Registration failed. Please check your information.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left Showcase */}
      <section className="auth-showcase-panel">
        <div className="auth-showcase-content">
          <Link to="/" className="brand-logo showcase-brand">
            <span className="brand-icon">S</span>
            <span className="brand-text light">
              Shop<span className="brand-highlight">Sphere</span>
            </span>
          </Link>

          <h1>
            Join the ShopSphere <br />
            <span>Shopping Community.</span>
          </h1>

          <p className="showcase-desc">
            Create your free account today and unlock seamless order tracking,
            personalized product recommendations, and instant checkout discounts.
          </p>

          <div className="showcase-features">
            <div className="showcase-feature-item">
              <div className="feature-icon-circle">
                <CheckCircle size={20} />
              </div>
              <div>
                <strong>Instant Account Activation</strong>
                <small>Ready to shop and checkout in under 30 seconds</small>
              </div>
            </div>

            <div className="showcase-feature-item">
              <div className="feature-icon-circle">
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong>Industry-Standard Encryption</strong>
                <small>BCrypt protected credentials & stateless JWT safety</small>
              </div>
            </div>

            <div className="showcase-feature-item">
              <div className="feature-icon-circle">
                <Truck size={20} />
              </div>
              <div>
                <strong>Free Delivery Eligibility</strong>
                <small>Automatic free shipping applied on orders over ₹1,999</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Register Form */}
      <section className="auth-form-panel">
        <div className="auth-card-wrapper">
          <div className="auth-header">
            <h2>Create Your Account</h2>
            <p>
              Already registered?{" "}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>

          {error && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reg-name">Full Name *</label>
              <div className="input-with-icon">
                <User size={18} className="field-icon" />
                <input
                  type="text"
                  id="reg-name"
                  name="name"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address *</label>
              <div className="input-with-icon">
                <Mail size={18} className="field-icon" />
                <input
                  type="email"
                  id="reg-email"
                  name="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password (min. 6 characters) *</label>
              <div className="input-with-icon">
                <Lock size={18} className="field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="reg-password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm-password">Confirm Password *</label>
              <div className="input-with-icon">
                <Lock size={18} className="field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="reg-confirm-password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg auth-submit-btn"
              disabled={loading}
            >
              <span>{loading ? "Creating Account..." : "Create Free Account"}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-footer-terms">
            By registering, you acknowledge that you agree to our{" "}
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a> and{" "}
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
          </div>
        </div>
      </section>
    </div>
  );
}
