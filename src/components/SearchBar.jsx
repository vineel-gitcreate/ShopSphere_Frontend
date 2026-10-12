import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";

export default function SearchBar({ initialQuery = "", onSearch }) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (onSearch) {
      onSearch(trimmed);
    } else {
      navigate(`/products?keyword=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    if (onSearch) onSearch("");
  };

  return (
    <form className="search-box" onSubmit={handleSubmit}>
      <Search size={18} className="search-icon" />
      <input
        type="text"
        placeholder="Search over 1,000+ products, categories & brands..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search products"
      />
      {query && (
        <button type="button" className="clear-search-btn" onClick={handleClear} aria-label="Clear search">
          <X size={15} />
        </button>
      )}
      <button type="submit" className="search-submit-btn">
        Search
      </button>
    </form>
  );
}
