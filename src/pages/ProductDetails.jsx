import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  ShoppingBag,
  Zap,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  Minus,
  Plus,
  ArrowLeft,
  Heart,
  Trash2,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../components/ProductCard";
import ProductCard from "../components/ProductCard";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedNotice, setAddedNotice] = useState(false);

  // Reviews state
  const [reviewsData, setReviewsData] = useState({
    stats: { averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    reviews: [],
  });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState({ type: "", text: "" });

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await api.get(`/products/${id}/reviews`);
      setReviewsData(res.data);
    } catch (err) {
      console.warn("Could not fetch reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");
        setQuantity(1);

        const response = await api.get(`/products/${id}`);
        if (!active) return;
        setProduct(response.data);

        // Fetch related products from same category
        if (response.data.categoryId) {
          try {
            const relatedRes = await api.get(`/products?categoryId=${response.data.categoryId}&size=4`);
            if (active) {
              const relList = relatedRes.data.content || relatedRes.data || [];
              setRelatedProducts(relList.filter((p) => p.id !== Number(id)).slice(0, 4));
            }
          } catch (ignored) {
          }
        }
      } catch (err) {
        if (active) {
          setError("Product could not be found or failed to load.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();
    loadReviews();

    return () => {
      active = false;
    };
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    try {
      setSubmittingReview(true);
      setReviewNotice({ type: "", text: "" });
      await api.post(`/products/${id}/reviews`, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      });
      setReviewNotice({ type: "success", text: "Thank you! Your verified review has been published." });
      setReviewForm({ rating: 5, comment: "" });
      loadReviews();
      // Sync product rating
      const prodRes = await api.get(`/products/${id}`);
      setProduct(prodRes.data);
      setTimeout(() => setReviewNotice({ type: "", text: "" }), 5000);
    } catch (err) {
      setReviewNotice({
        type: "error",
        text: err.response?.data?.message || "Failed to submit review. Please try again.",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.delete(`/products/${id}/reviews/${reviewId}`);
      loadReviews();
      const prodRes = await api.get(`/products/${id}`);
      setProduct(prodRes.data);
    } catch (err) {
      alert("Failed to delete review.");
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "100px 20px", textAlign: "center" }}>
        <div className="loading-spinner" />
        <p style={{ marginTop: "16px", color: "var(--text-muted)" }}>Loading product specifications...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: "100px 20px" }}>
        <div className="empty-state large">
          <h2>Product Not Found</h2>
          <p>{error || "We couldn't locate the requested product."}</p>
          <Link to="/products" className="btn btn-primary">
            <ArrowLeft size={16} /> Return to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const inWishlist = isInWishlist(product.id);
  const categoryName = product.categoryName || (typeof product.category === "object" ? product.category?.name : product.category);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2200);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    navigate("/checkout");
  };

  const increaseQty = () => {
    if (quantity < product.stock) {
      setQuantity((q) => q + 1);
    }
  };

  const decreaseQty = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  return (
    <main className="page product-details-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          {categoryName && (
            <>
              <span>/</span>
              <Link to={`/products?category=${encodeURIComponent(categoryName)}`}>{categoryName}</Link>
            </>
          )}
          <span>/</span>
          <span className="current">{product.name}</span>
        </div>

        {/* Product Details Hero Grid */}
        <div className="details-layout">
          {/* Left: Product Image */}
          <div className="details-image-panel">
            <div className="details-image-frame">
              <img
                src={product.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"}
                alt={product.name}
                className="details-main-img"
              />
              {product.discountPercentage > 0 && (
                <span className="badge badge-discount large-badge">
                  {product.discountPercentage}% OFF
                </span>
              )}
              <button
                type="button"
                className={`wish-btn large-wish ${inWishlist ? "active" : ""}`}
                onClick={() => toggleWishlist(product)}
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={20} fill={inWishlist ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          {/* Right: Product Information & Purchase Controls */}
          <div className="details-info-panel">
            {categoryName && <span className="product-category-pill">{categoryName}</span>}

            <h1 className="details-title">{product.name}</h1>

            {/* Ratings & Reviews */}
            <div className="details-rating-row">
              <div className="stars-inline">
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <strong>{product.rating ? Number(product.rating).toFixed(1) : "4.5"}</strong>
              </div>
              <span className="dot-sep">•</span>
              <span className="reviews-text">{product.reviewCount || 128} customer ratings</span>
              <span className="dot-sep">•</span>
              <span className="verified-badge">Verified Authentic</span>
            </div>

            {/* Price Box */}
            <div className="details-price-box">
              <div className="price-main">
                <span className="details-current-price">{formatPrice(product.price)}</span>
                {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                  <del className="details-original-price">{formatPrice(product.originalPrice)}</del>
                )}
              </div>
              {product.discountPercentage > 0 && (
                <div className="savings-badge">
                  Save {product.discountPercentage}% today
                </div>
              )}
            </div>

            {/* Description */}
            <div className="details-desc">
              <p>{product.description || "Designed with premium craftmanship, exceptional materials, and everyday durability in mind."}</p>
            </div>

            {/* Stock Indicator */}
            <div className="details-stock-status">
              {isOutOfStock ? (
                <span className="stock-label out-of-stock">✕ Out of stock</span>
              ) : (
                <span className="stock-label in-stock">
                  ✓ In Stock ({product.stock} units available)
                </span>
              )}
            </div>

            {/* Purchase Row */}
            {!isOutOfStock && (
              <div className="purchase-controls-row">
                {/* Quantity Selector */}
                <div className="quantity-counter">
                  <button
                    type="button"
                    onClick={decreaseQty}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="qty-number">{quantity}</span>
                  <button
                    type="button"
                    onClick={increaseQty}
                    disabled={quantity >= product.stock}
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  className={`btn btn-primary add-to-cart-large ${addedNotice ? "success" : ""}`}
                  onClick={handleAddToCart}
                >
                  {addedNotice ? (
                    <>
                      <Check size={18} /> Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} /> Add to Cart
                    </>
                  )}
                </button>

                {/* Buy Now Button */}
                <button
                  type="button"
                  className="btn btn-secondary buy-now-btn"
                  onClick={handleBuyNow}
                >
                  <Zap size={18} />
                  <span>Buy Now</span>
                </button>
              </div>
            )}

            {/* Value Guarantees Box */}
            <div className="details-guarantees-grid">
              <div className="guarantee-card">
                <Truck size={18} />
                <div>
                  <strong>Free Express Delivery</strong>
                  <small>Dispatched within 24 hours</small>
                </div>
              </div>
              <div className="guarantee-card">
                <RotateCcw size={18} />
                <div>
                  <strong>7-Day Easy Returns</strong>
                  <small>No questions asked</small>
                </div>
              </div>
              <div className="guarantee-card">
                <ShieldCheck size={18} />
                <div>
                  <strong>1-Year Brand Warranty</strong>
                  <small>100% genuine replacement</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews & Ratings Section */}
        <section className="section product-reviews-section">
          <div className="section-header">
            <div>
              <span className="section-eyebrow">Customer Feedback</span>
              <h2 className="section-title">Verified Ratings & Reviews</h2>
            </div>
          </div>

          <div className="reviews-layout-grid">
            {/* Left: Overall Rating Card */}
            <div className="review-summary-card">
              <div className="summary-score-box">
                <span className="big-rating-number">
                  {reviewsData.stats?.averageRating ? reviewsData.stats.averageRating.toFixed(1) : "0.0"}
                </span>
                <div className="star-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      fill={star <= Math.round(reviewsData.stats?.averageRating || 0) ? "var(--warning)" : "none"}
                      color={star <= Math.round(reviewsData.stats?.averageRating || 0) ? "var(--warning)" : "var(--border)"}
                    />
                  ))}
                </div>
                <small className="summary-total-text">
                  Based on {reviewsData.stats?.totalReviews || 0} customer reviews
                </small>
              </div>

              {/* Rating Bars */}
              <div className="rating-bars-list">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviewsData.stats?.distribution?.[stars] || 0;
                  const total = reviewsData.stats?.totalReviews || 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={stars} className="rating-bar-row">
                      <span className="bar-label">{stars} ★</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="bar-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Write a Review Form or Login Prompt */}
            <div className="write-review-card">
              <h3>Share Your Experience</h3>
              <p className="write-review-sub">
                Help other shoppers make informed purchasing decisions with your honest review.
              </p>

              {reviewNotice.text && (
                <div className={reviewNotice.type === "success" ? "success-alert" : "error-alert"}>
                  {reviewNotice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{reviewNotice.text}</span>
                </div>
              )}

              {isAuthenticated ? (
                <form onSubmit={handleReviewSubmit} className="review-form">
                  <div className="form-group">
                    <label>Your Rating *</label>
                    <div className="interactive-star-selector">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="star-btn"
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                        >
                          <Star
                            size={28}
                            fill={(hoverRating || reviewForm.rating) >= s ? "var(--warning)" : "none"}
                            color={(hoverRating || reviewForm.rating) >= s ? "var(--warning)" : "var(--border)"}
                          />
                        </button>
                      ))}
                      <span className="star-level-text">
                        {({
                          1: "Poor",
                          2: "Fair",
                          3: "Good",
                          4: "Very Good",
                          5: "Excellent!",
                        })[hoverRating || reviewForm.rating]}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reviewComment">Your Review Comments *</label>
                    <textarea
                      id="reviewComment"
                      rows={3}
                      placeholder="Write about product build quality, sound/comfort, battery life, packaging..."
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingReview}
                  >
                    <Send size={16} />
                    <span>{submittingReview ? "Publishing..." : "Submit Review"}</span>
                  </button>
                </form>
              ) : (
                <div className="review-login-prompt">
                  <MessageSquare size={32} />
                  <p>Please log in to your verified ShopSphere account to post a rating and review.</p>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => navigate("/login", { state: { from: { pathname: `/products/${id}` } } })}
                  >
                    Sign In to Review
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reviews List */}
          <div className="reviews-feed-container">
            <h3>Verified Customer Reviews ({reviewsData.reviews?.length || 0})</h3>

            {loadingReviews ? (
              <div className="reviews-loading">
                <div className="loading-spinner" />
                <span>Loading product reviews...</span>
              </div>
            ) : reviewsData.reviews?.length === 0 ? (
              <div className="no-reviews-box">
                <MessageSquare size={28} />
                <p>No reviews yet for this product. Be the first customer to share your thoughts!</p>
              </div>
            ) : (
              <div className="reviews-grid">
                {reviewsData.reviews.map((rev) => {
                  const isOwner = user && (user.id === rev.userId || user.email === rev.userEmail);
                  const canDelete = isOwner || isAdmin;
                  const dateStr = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }) : "Recent";

                  return (
                    <article key={rev.id} className="review-item-card">
                      <div className="review-card-top">
                        <div className="reviewer-info">
                          <div className="reviewer-avatar">
                            {rev.userName ? rev.userName.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="reviewer-name-row">
                              <strong>{rev.userName}</strong>
                              <span className="verified-badge">
                                <Check size={12} /> Verified Buyer
                              </span>
                            </div>
                            <span className="review-date">{dateStr}</span>
                          </div>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            className="review-delete-btn"
                            title="Delete review"
                            onClick={() => handleDeleteReview(rev.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="review-stars-row">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            fill={star <= rev.rating ? "var(--warning)" : "none"}
                            color={star <= rev.rating ? "var(--warning)" : "var(--border)"}
                          />
                        ))}
                      </div>

                      <p className="review-body-text">{rev.comment}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Related Products Showcase */}
        {relatedProducts.length > 0 && (
          <section className="section related-products-section">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Similar Items</span>
                <h2 className="section-title">Customers Also Viewed</h2>
              </div>
            </div>
            <div className="product-grid">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
