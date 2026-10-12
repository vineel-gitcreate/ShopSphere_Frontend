import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated, token } = useAuth();

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shopsphere_cart")) || [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shopsphere_wishlist")) || [];
    } catch {
      return [];
    }
  });

  const [backendCartId, setBackendCartId] = useState(null);
  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Database-driven promotional coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shopsphere_coupon")) || null;
    } catch {
      return null;
    }
  });
  const [activeCoupons, setActiveCoupons] = useState([]);

  // Fetch available promotional coupons for shoppers
  const fetchActiveCoupons = useCallback(async () => {
    try {
      const res = await api.get("/coupons/active");
      if (Array.isArray(res.data)) {
        setActiveCoupons(res.data);
      }
    } catch (ignored) {
    }
  }, []);

  useEffect(() => {
    fetchActiveCoupons();
  }, [fetchActiveCoupons]);

  // Sync cart from backend when authenticated
  const fetchBackendCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingCart(true);
      const response = await api.get("/cart");
      if (response.data) {
        setBackendCartId(response.data.id);
        const mappedItems = (response.data.items || []).map((item) => ({
          id: item.productId,
          cartItemId: item.id,
          name: item.productName,
          price: Number(item.price),
          image: item.productImageUrl,
          imageUrl: item.productImageUrl,
          quantity: item.quantity,
          stock: item.availableStock,
        }));
        setCart(mappedItems);
        localStorage.setItem("shopsphere_cart", JSON.stringify(mappedItems));
      }
    } catch (err) {
      // Backend cart may be empty or newly created
      console.warn("Could not sync backend cart:", err);
    } finally {
      setLoadingCart(false);
    }
  }, [isAuthenticated]);

  // Sync wishlist from MySQL backend when authenticated
  const fetchBackendWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingWishlist(true);
      const response = await api.get("/wishlist");
      if (Array.isArray(response.data)) {
        const mappedItems = response.data.map((item) => ({
          id: item.productId,
          productId: item.productId,
          wishlistItemId: item.id,
          name: item.name,
          price: Number(item.price),
          originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
          discountPercentage: item.discountPercentage,
          image: item.imageUrl,
          imageUrl: item.imageUrl,
          category: item.category,
          rating: item.rating,
          reviewCount: item.reviewCount,
          stock: item.stock,
        }));
        setWishlist(mappedItems);
        localStorage.setItem("shopsphere_wishlist", JSON.stringify(mappedItems));
      }
    } catch (err) {
      console.warn("Could not sync backend wishlist:", err);
    } finally {
      setLoadingWishlist(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBackendCart();

      // Auto-sync guest localStorage wishlist into MySQL on login
      const localGuestWishlist = (() => {
        try {
          return JSON.parse(localStorage.getItem("shopsphere_wishlist")) || [];
        } catch {
          return [];
        }
      })();
      const guestIds = localGuestWishlist.map((item) => item.id || item.productId).filter(Boolean);

      if (guestIds.length > 0) {
        api.post("/wishlist/sync", guestIds)
          .then((res) => {
            if (Array.isArray(res.data)) {
              const mapped = res.data.map((item) => ({
                id: item.productId,
                productId: item.productId,
                wishlistItemId: item.id,
                name: item.name,
                price: Number(item.price),
                originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
                discountPercentage: item.discountPercentage,
                image: item.imageUrl,
                imageUrl: item.imageUrl,
                category: item.category,
                rating: item.rating,
                reviewCount: item.reviewCount,
                stock: item.stock,
              }));
              setWishlist(mapped);
              localStorage.setItem("shopsphere_wishlist", JSON.stringify(mapped));
            }
          })
          .catch(() => {
            fetchBackendWishlist();
          });
      } else {
        fetchBackendWishlist();
      }
    }
  }, [isAuthenticated, token, fetchBackendCart, fetchBackendWishlist]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("shopsphere_cart", JSON.stringify(cart));
  }, [cart]);

  // Persist wishlist to localStorage
  useEffect(() => {
    localStorage.setItem("shopsphere_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Add product to cart
  const addToCart = async (product, quantity = 1) => {
    if (!product || quantity < 1) return;

    const productId = product.id;
    const existing = cart.find((item) => item.id === productId);

    if (isAuthenticated) {
      try {
        await api.post("/cart/items", {
          productId: productId,
          quantity: quantity,
        });
        await fetchBackendCart();
        return;
      } catch (err) {
        console.warn("Backend add to cart failed, fallback to local:", err);
      }
    }

    // Local cart fallback
    setCart((current) => {
      const found = current.find((item) => item.id === productId);
      if (found) {
        return current.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image: product.imageUrl || product.image || "",
          imageUrl: product.imageUrl || product.image || "",
          stock: product.stock ?? 10,
          quantity: quantity,
        },
      ];
    });
  };

  // Update quantity in cart
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find((i) => i.id === productId);

    if (isAuthenticated && item?.cartItemId) {
      try {
        await api.put(`/cart/items/${item.cartItemId}`, {
          quantity: newQuantity,
        });
        await fetchBackendCart();
        return;
      } catch (err) {
        console.warn("Backend update cart failed:", err);
      }
    }

    // Local cart fallback
    setCart((current) =>
      current.map((i) =>
        i.id === productId ? { ...i, quantity: newQuantity } : i
      )
    );
  };

  // Remove product from cart
  const removeFromCart = async (productId) => {
    const item = cart.find((i) => i.id === productId);

    if (isAuthenticated && item?.cartItemId) {
      try {
        await api.delete(`/cart/items/${item.cartItemId}`);
        await fetchBackendCart();
        return;
      } catch (err) {
        console.warn("Backend remove cart failed:", err);
      }
    }

    setCart((current) => current.filter((i) => i.id !== productId));
  };

  // Clear entire cart
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.delete("/cart");
      } catch (err) {
        console.warn("Backend clear cart failed:", err);
      }
    }
    setCart([]);
    localStorage.removeItem("shopsphere_cart");
    setAppliedCoupon(null);
    localStorage.removeItem("shopsphere_coupon");
  };

  // Wishlist toggle with optimistic UI and MySQL persistence
  const toggleWishlist = async (product) => {
    if (!product) return;
    const targetId = Number(product.id || product.productId);
    const alreadyExists = wishlist.some((item) => Number(item.id || item.productId) === targetId);

    // Optimistically update local wishlist immediately
    if (alreadyExists) {
      setWishlist((current) =>
        current.filter((item) => Number(item.id || item.productId) !== targetId)
      );
    } else {
      setWishlist((current) => [
        ...current,
        {
          id: targetId,
          productId: targetId,
          name: product.name,
          price: Number(product.price),
          originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
          discountPercentage: product.discountPercentage,
          image: product.imageUrl || product.image || "",
          imageUrl: product.imageUrl || product.image || "",
          category: typeof product.category === "object" ? product.category?.name : product.category,
          rating: product.rating,
          reviewCount: product.reviewCount,
          stock: product.stock,
        },
      ]);
    }

    // Persist to MySQL if authenticated
    if (isAuthenticated) {
      try {
        const response = await api.post(`/wishlist/${targetId}/toggle`);
        if (response.data?.inWishlist && response.data?.item) {
          const savedItem = response.data.item;
          setWishlist((current) =>
            current.map((w) =>
              Number(w.id || w.productId) === targetId
                ? {
                    ...w,
                    wishlistItemId: savedItem.id,
                  }
                : w
            )
          );
        }
      } catch (err) {
        console.warn("Backend toggle wishlist failed, fallback to local:", err);
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    const targetId = Number(productId);
    setWishlist((current) =>
      current.filter((item) => Number(item.id || item.productId) !== targetId)
    );

    if (isAuthenticated) {
      try {
        await api.delete(`/wishlist/${targetId}`);
      } catch (err) {
        console.warn("Backend remove from wishlist failed:", err);
      }
    }
  };

  const clearWishlist = async () => {
    setWishlist([]);
    localStorage.removeItem("shopsphere_wishlist");

    if (isAuthenticated) {
      try {
        await api.delete("/wishlist");
      } catch (err) {
        console.warn("Backend clear wishlist failed:", err);
      }
    }
  };

  const isInWishlist = (productId) => {
    if (productId == null) return false;
    const targetId = Number(productId);
    return wishlist.some((item) => Number(item.id || item.productId) === targetId);
  };

  // Database-driven coupon application and validation
  const applyCouponCode = async (code) => {
    if (!code || !code.trim()) {
      return { valid: false, message: "Please provide a coupon code." };
    }
    try {
      const response = await api.post("/coupons/apply", {
        code: code.trim().toUpperCase(),
        orderAmount: subtotal,
      });

      if (response.data && response.data.valid) {
        setAppliedCoupon(response.data);
        localStorage.setItem("shopsphere_coupon", JSON.stringify(response.data));
      }
      return response.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Could not validate coupon. Please try again.";
      return { valid: false, message: msg };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem("shopsphere_coupon");
  };

  // Calculations
  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  }, [cart]);

  // Recalculate coupon discount against dynamic subtotal
  const discount = useMemo(() => {
    if (!appliedCoupon || !appliedCoupon.valid) return 0;
    const pct = Number(appliedCoupon.discountPercentage || 0);
    if (pct <= 0) return 0;
    return Math.round((subtotal * pct) / 100);
  }, [appliedCoupon, subtotal]);

  const shipping = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= 1999 ? 0 : 99;
  }, [subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount + shipping);
  }, [subtotal, discount, shipping]);

  const value = {
    cart,
    wishlist,
    cartCount,
    wishlistCount: wishlist.length,
    subtotal,
    discount,
    shipping,
    total,
    loadingCart,
    loadingWishlist,
    appliedCoupon,
    activeCoupons,
    applyCouponCode,
    removeCoupon,
    fetchActiveCoupons,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    fetchBackendCart,
    fetchBackendWishlist,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
