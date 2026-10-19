
import axios from "axios";

// Deployed ShopSphere backend on Render
const DEPLOYED_BACKEND_URL =
  "https://shopsphere-backend-vntp.onrender.com/api";

// Determine API base URL
const getApiBaseUrl = () => {
  const envUrl =
    (typeof process !== "undefined" &&
      process.env &&
      process.env.REACT_APP_API_URL) ||
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL);

  let target = envUrl || DEPLOYED_BACKEND_URL;

  // Use the deployed backend instead of localhost in production
  if (!target.trim() || target.includes("localhost")) {
    target = DEPLOYED_BACKEND_URL;
  }

  // Remove trailing slashes
  const trimmed = target.trim().replace(/\/+$/, "");

  // Ensure /api appears exactly once
  return trimmed.endsWith("/api")
    ? trimmed
    : `${trimmed}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export const BACKEND_ROOT_URL =
  API_BASE_URL.replace(/\/api$/, "");

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("shopsphere_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired or invalid authentication
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";
      const isLoginRequest = requestUrl.includes("/auth/login");

      if (
        localStorage.getItem("shopsphere_token") &&
        !isLoginRequest
      ) {
        localStorage.removeItem("shopsphere_token");
        localStorage.removeItem("shopsphere_user");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
