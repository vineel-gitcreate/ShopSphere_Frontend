import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  SlidersHorizontal,
  X,
  Search,
  RotateCcw,
  Star,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
} from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State initialized from URL query params
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("inStockOnly") === "true");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 0);

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get("/categories");
        setCategories(res.data || []);
      } catch (err) {
        console.warn("Could not load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Fetch products with all filters
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (keyword.trim()) params.set("keyword", keyword.trim());
      if (selectedCategory) params.set("category", selectedCategory);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (minRating) params.set("minRating", minRating);
      if (inStockOnly) params.set("inStockOnly", "true");
      params.set("sortBy", sortBy);
      params.set("page", currentPage.toString());
      params.set("size", "12");

      const response = await api.get(`/products?${params.toString()}`);

      if (response.data && response.data.content) {
        setProducts(response.data.content);
        setTotalPages(response.data.totalPages || 1);
        setTotalElements(response.data.totalElements || 0);
      } else if (Array.isArray(response.data)) {
        setProducts(response.data);
        setTotalPages(1);
        setTotalElements(response.data.length);
      }
    } catch (err) {
      setError("Unable to retrieve products. Please check the backend connection.");
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedCategory, minPrice, maxPrice, minRating, inStockOnly, sortBy, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync state with URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (selectedCategory) params.set("category", selectedCategory);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minRating) params.set("minRating", minRating);
    if (inStockOnly) params.set("inStockOnly", "true");
    if (sortBy !== "newest") params.set("sortBy", sortBy);
    if (currentPage > 0) params.set("page", currentPage.toString());

    setSearchParams(params, { replace: true });
  }, [keyword, selectedCategory, minPrice, maxPrice, minRating, inStockOnly, sortBy, currentPage, setSearchParams]);

  const handleResetFilters = () => {
    setKeyword("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setInStockOnly(false);
    setSortBy("newest");
    setCurrentPage(0);
  };

  return (
    <main className="page products-page">
      <div className="container">
        {/* Breadcrumb Header */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Products</span>
          {selectedCategory && (
            <>
              <span>/</span>
              <span className="current">{selectedCategory}</span>
            </>
          )}
        </div>

        {/* Page Title & Mobile Trigger */}
        <div className="catalog-header">
          <div>
            <h1>Explore Catalog</h1>
            <p className="catalog-meta">
              Showing {totalElements} {totalElements === 1 ? "product" : "products"}
              {selectedCategory && ` in ${selectedCategory}`}
              {keyword && ` matching "${keyword}"`}
            </p>
          </div>

          <div className="catalog-actions-bar">
            <button
              type="button"
              className="btn btn-outline mobile-filter-trigger"
              onClick={() => setMobileFilterOpen(true)}
            >
              <SlidersHorizontal size={16} />
              <span>Filters</span>
            </button>

            <div className="sort-box">
              <label htmlFor="sort-select">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(0);
                }}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout Grid (Filters Sidebar + Products Grid) */}
        <div className="catalog-layout">
          {/* Sidebar Filters */}
          <aside className={`catalog-filters ${mobileFilterOpen ? "drawer-open" : ""}`}>
            <div className="filters-header">
              <h3>Filter Products</h3>
              <button
                type="button"
                className="close-drawer-btn"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            {/* Keyword Search Filter */}
            <div className="filter-group">
              <label className="filter-group-title">Search Keywords</label>
              <div className="sidebar-search-box">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="e.g. Headphones, Shoes"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setCurrentPage(0);
                  }}
                />
                {keyword && (
                  <button type="button" onClick={() => setKeyword("")}>
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Categories Filter */}
            <div className="filter-group">
              <label className="filter-group-title">Category</label>
              <div className="filter-options-list">
                <button
                  type="button"
                  className={`filter-btn-pill ${!selectedCategory ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedCategory("");
                    setCurrentPage(0);
                  }}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id || c.name}
                    type="button"
                    className={`filter-btn-pill ${
                      selectedCategory.toLowerCase() === c.name.toLowerCase() ? "selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedCategory(c.name);
                      setCurrentPage(0);
                    }}
                  >
                    <span>{c.name}</span>
                    {c.productCount != null && <small>({c.productCount})</small>}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="filter-group">
              <label className="filter-group-title">Price Range (₹)</label>
              <div className="price-inputs-row">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setCurrentPage(0);
                  }}
                />
                <span className="price-dash">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setCurrentPage(0);
                  }}
                />
              </div>
            </div>

            {/* Customer Rating Filter */}
            <div className="filter-group">
              <label className="filter-group-title">Minimum Rating</label>
              <div className="rating-filter-options">
                {[4, 3, 2].map((stars) => (
                  <label key={stars} className="radio-label">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === stars.toString()}
                      onChange={() => {
                        setMinRating(stars.toString());
                        setCurrentPage(0);
                      }}
                    />
                    <div className="stars-inline">
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span>{stars} Stars & above</span>
                    </div>
                  </label>
                ))}
                <label className="radio-label">
                  <input
                    type="radio"
                    name="rating"
                    checked={!minRating}
                    onChange={() => {
                      setMinRating("");
                      setCurrentPage(0);
                    }}
                  />
                  <span>All Ratings</span>
                </label>
              </div>
            </div>

            {/* In Stock Only Checkbox */}
            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setCurrentPage(0);
                  }}
                />
                <span>In Stock Only</span>
              </label>
            </div>

            {/* Reset Filters */}
            <button
              type="button"
              className="btn btn-outline btn-full reset-filters-btn"
              onClick={handleResetFilters}
            >
              <RotateCcw size={15} />
              <span>Reset All Filters</span>
            </button>
          </aside>

          {/* Catalog Main Content */}
          <section className="catalog-main">
            {error && (
              <div className="error-alert">
                <p>{error}</p>
                <button type="button" onClick={fetchProducts} className="btn btn-sm btn-outline">
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="product-skeleton-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="skeleton-card" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state large">
                <div className="empty-icon-circle">
                  <PackageOpen size={36} />
                </div>
                <h2>No Products Found</h2>
                <p>
                  No items matched your search and filter criteria. Try adjusting your
                  keywords or resetting the applied filters.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleResetFilters}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination-wrapper">
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={18} />
                      <span>Previous</span>
                    </button>

                    <div className="pagination-pages">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`page-num-btn ${currentPage === i ? "active" : ""}`}
                          onClick={() => setCurrentPage(i)}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      aria-label="Next page"
                    >
                      <span>Next</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
