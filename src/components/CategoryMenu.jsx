import { Link } from "react-router-dom";
import {
  Laptop,
  Shirt,
  Home,
  Sparkles,
  Dumbbell,
  Watch,
  LayoutGrid,
} from "lucide-react";

const categoryIconMap = {
  Electronics: Laptop,
  Fashion: Shirt,
  "Home & Living": Home,
  Beauty: Sparkles,
  Sports: Dumbbell,
  Accessories: Watch,
};

export default function CategoryMenu({ categories = [], activeCategory = "", onSelectCategory }) {
  return (
    <nav className="category-menu-bar" aria-label="Product categories">
      <div className="container category-menu-scroll">
        <button
          type="button"
          className={`category-pill ${!activeCategory ? "active" : ""}`}
          onClick={() => onSelectCategory && onSelectCategory("")}
        >
          <LayoutGrid size={15} />
          <span>All Products</span>
        </button>

        {categories.map((cat) => {
          const Icon = categoryIconMap[cat.name] || Sparkles;
          const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase();

          return onSelectCategory ? (
            <button
              key={cat.id || cat.name}
              type="button"
              className={`category-pill ${isActive ? "active" : ""}`}
              onClick={() => onSelectCategory(cat.name)}
            >
              <Icon size={15} />
              <span>{cat.name}</span>
            </button>
          ) : (
            <Link
              key={cat.id || cat.name}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className={`category-pill ${isActive ? "active" : ""}`}
            >
              <Icon size={15} />
              <span>{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
