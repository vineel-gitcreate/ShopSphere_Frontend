import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  X,
  HelpCircle,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState("");

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: request code, 2: reset password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [devHint, setDevHint] = useState("");

  const fromLocation = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const executeLogin = async (email, password) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password: password,
      });

      const { token, user } = response.data;
      if (!token || !user) {
        throw new Error("Invalid response received from authentication server.");
      }

      login(user, token);

      if (user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate(fromLocation, { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid email or password. Please verify your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError("Please provide both email and password.");
      return;
    }
    executeLogin(form.email, form.password);
  };

  const handleSendRecoveryCode = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your account email address.");
      return;
    }

    try {
      setForgotLoading(true);
      setForgotError("");
      const res = await api.post("/auth/forgot-password", { email: forgotEmail.trim() });
      setDevHint(res.data?.devTokenHint || "");
      if (res.data?.devTokenHint) {
        setForgotToken(res.data.devTokenHint);
      }
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Could not find an account with that email address.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotToken.trim()) {
      setForgotError("Please provide the 6-digit verification code.");
      return;
    }
    if (newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match. Please verify.");
      return;
    }

    try {
      setForgotLoading(true);
      setForgotError("");
      await api.post("/auth/reset-password", {
        token: forgotToken.trim(),
        newPassword: newPassword,
      });

      setForgotModalOpen(false);
      setForm((prev) => ({ ...prev, email: forgotEmail, password: "" }));
      setLoginSuccessNotice("Password has been reset successfully! Please sign in with your new password.");
      setTimeout(() => setLoginSuccessNotice(""), 7000);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Invalid or expired recovery code. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left Promotional Showcase */}
      <section className="auth-showcase-panel">
        <div className="auth-showcase-content">
          <Link to="/" className="brand-logo showcase-brand">
            <span className="brand-icon">S</span>
            <span className="brand-text light">
              Shop<span className="brand-highlight">Sphere</span>
            </span>
          </Link>

          <h1>
            Your Gateway to <br />
            <span>Curated Lifestyle & Tech.</span>
          </h1>

          <p className="showcase-desc">
            Sign in to track orders in real-time, save your favorite products to
            wishlist, and experience priority checkout with guaranteed buyer protection.
          </p>

          <div className="showcase-features">
            <div className="showcase-feature-item">
              <div className="feature-icon-circle">
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong>Secure JWT Authentication</strong>
                <small>Encrypted sessions with BCrypt hashed security</small>
              </div>
            </div>

            <div className="showcase-feature-item">
              <div className="feature-icon-circle">
                <Truck size={20} />
              </div>
              <div>
                <strong>Fast Express Doorstep Delivery</strong>
                <small>Track live package milestones from order to delivery</small>
              </div>
            </div>

            <div className="showcase-feature-item">
              <div className="feature-icon-circle">
                <Sparkles size={20} />
              </div>
              <div>
                <strong>VIP Member Privileges</strong>
                <small>Exclusive flash sales and member-only coupons</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Login Form */}
      <section className="auth-form-panel">
        <div className="auth-card-wrapper">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>
              Don't have an account yet?{" "}
              <Link to="/register" className="auth-link">
                Create one now
              </Link>
            </p>
          </div>

          {loginSuccessNotice && (
            <div className="success-alert">
              <CheckCircle2 size={18} />
              <span>{loginSuccessNotice}</span>
            </div>
          )}

          {error && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="field-icon" />
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
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
              <div className="forgot-password-row">
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => {
                    setForgotModalOpen(true);
                    setForgotStep(1);
                    setForgotEmail(form.email || "");
                    setForgotError("");
                    setDevHint("");
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg auth-submit-btn"
              disabled={loading}
            >
              <span>{loading ? "Signing In..." : "Sign In to ShopSphere"}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-footer-terms">
            By signing in, you agree to ShopSphere's{" "}
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Use</a> and{" "}
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
          </div>
        </div>
      </section>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card forgot-password-modal">
            <div className="modal-header">
              <div className="modal-title-row">
                <div className="modal-icon-badge">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3>{forgotStep === 1 ? "Password Recovery" : "Set New Password"}</h3>
                  <p className="modal-subtitle">
                    {forgotStep === 1
                      ? "Enter your email to receive a secure recovery verification code"
                      : "Enter verification code and your new credentials"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setForgotModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {forgotError && (
              <div className="error-alert" style={{ margin: "16px 20px 0" }}>
                <AlertCircle size={18} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendRecoveryCode} className="modal-body">
                <div className="form-group">
                  <label htmlFor="recovery-email">Registered Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="field-icon" />
                    <input
                      type="email"
                      id="recovery-email"
                      placeholder="e.g. customer@shopsphere.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setForgotModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={forgotLoading}
                  >
                    <span>{forgotLoading ? "Dispatching Code..." : "Send Recovery Code"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="modal-body">
                {devHint && (
                  <div className="info-banner" style={{ marginBottom: "16px" }}>
                    <div className="dev-hint-badge">
                      <strong>Code dispatched to:</strong> {forgotEmail}
                      <br />
                      <span className="code-display">Code: {devHint}</span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="reset-token">6-Digit Verification Code *</label>
                  <input
                    type="text"
                    id="reset-token"
                    placeholder="Enter 6-digit code"
                    value={forgotToken}
                    onChange={(e) => setForgotToken(e.target.value)}
                    maxLength={10}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-password">New Password *</label>
                  <input
                    type="password"
                    id="new-password"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm New Password *</label>
                  <input
                    type="password"
                    id="confirm-password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setForgotStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={forgotLoading}
                  >
                    <span>{forgotLoading ? "Resetting..." : "Save New Password"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
