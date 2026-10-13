import axios from "axios";

// Determine the API base URL with production fallback to live Render backend
const getApiBaseUrl = () => {
  const envUrl =
    (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) ||
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL);

  const isProduction = process.env.NODE_ENV === "production";
  let target = envUrl;

  // In production builds (Vercel deployment), if env variable is unset or accidentally points to localhost,
  // automatically route to the live deployed Render backend so the app never throws ERR_CONNECTION_REFUSED.
  if (!target || (isProduction && target.includes("localhost"))) {
    target = "https://shopsphere-backend-ybp1.onrender.com/api";
  }

  // Ensure trailing slashes are removed and /api subpath is preserved
  const trimmed = target.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = getApiBaseUrl();
export const BACKEND_ROOT_URL = API_BASE_URL.replace(/\/api$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("shopsphere_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle authentication expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and has token, clear expired token
      const token = localStorage.getItem("shopsphere_token");
      if (token && !error.config.url.includes("/auth/login")) {
        localStorage.removeItem("shopsphere_token");
        localStorage.removeItem("shopsphere_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;