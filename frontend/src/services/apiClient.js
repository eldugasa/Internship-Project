// frontend/src/services/apiClient.js
import { QueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const queryClient = new QueryClient();

// List of auth endpoints that should NOT redirect on 401
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export const apiClient = async (endpoint, options = {}) => {
  // Get token from localStorage
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

  // Add cache-busting for GET requests
  if (method === "GET" && !options.skipCacheBust) {
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}_=${Date.now()}`;
  }

  const response = await fetch(url, {
    ...options,
    method,
    cache: options.cache || "no-store",
    signal: options.signal, // Pass abort signal
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return {};
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Handle 401 Unauthorized
    if (response.status === 401) {
      const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => endpoint.includes(ep));

      if (!isAuthEndpoint) {
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }

      throw new Error(data.message || data.error || "Invalid credentials");
    }

    const error = new Error(data.message || data.error || "Something went wrong");
    error.code = response.status;
    error.info = data;
    throw error;
  }

  return data;
};