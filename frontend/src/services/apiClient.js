// frontend/src/services/apiClient.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// List of auth endpoints that should NOT redirect on 401
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export const apiClient = async (endpoint, options = {}) => {
  // Get token from localStorage (your AuthContext stores user with token)
  const userStr = localStorage.getItem("user");
  let token = null;

  try {
    const user = JSON.parse(userStr);
    token = user?.token;
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
  }

  const method = (options.method || "GET").toUpperCase();
  let url = `${API_URL}${endpoint}`;

  if (method === "GET") {
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}_=${Date.now()}`;
  }

  const res = await fetch(url, {
    ...options,
    method,
    cache: options.cache || "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Handle 401 Unauthorized
    if (res.status === 401) {
      // Check if this is an auth endpoint (login, register, etc.)
      const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => endpoint.includes(ep));

      if (!isAuthEndpoint) {
        // Only redirect for non-auth endpoints (session expired)
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }

      // For auth endpoints, just throw the error to be handled by the component
      throw new Error(data.message || data.error || "Invalid credentials");
    }

    throw new Error(data.message || data.error || "Something went wrong");
  }

  return data;
};
