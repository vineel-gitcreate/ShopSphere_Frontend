import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shopsphere_user")) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("shopsphere_token") || null;
  });

  const [loading, setLoading] = useState(true);

  // Sync with backend on startup if token exists
  useEffect(() => {
    let active = true;

    async function syncAuth() {
      const storedToken = localStorage.getItem("shopsphere_token");
      if (!storedToken) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        if (active && response.data) {
          setUser(response.data);
          localStorage.setItem("shopsphere_user", JSON.stringify(response.data));
        }
      } catch (err) {
        // Token is invalid or expired
        if (active) {
          localStorage.removeItem("shopsphere_token");
          localStorage.removeItem("shopsphere_user");
          setUser(null);
          setToken(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    syncAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = (userData, jwtToken) => {
    localStorage.setItem("shopsphere_token", jwtToken);
    localStorage.setItem("shopsphere_user", JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // Invalidation log
      console.warn("Server-side token invalidation failed or already expired:", err?.message);
    } finally {
      localStorage.removeItem("shopsphere_token");
      localStorage.removeItem("shopsphere_user");
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedData) => {
    const updated = { ...user, ...updatedData };
    localStorage.setItem("shopsphere_user", JSON.stringify(updated));
    setUser(updated);
  };

  const isAdmin = user?.role === "ADMIN";
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
