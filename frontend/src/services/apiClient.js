import { QueryClient } from "@tanstack/react-query";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const queryClient = new QueryClient();

const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh",
  "/auth/logout",
];

const getFriendlyErrorMessage = (status, message, endpoint) => {
  const normalizedMessage = (message || "").toLowerCase().trim();
  const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => endpoint.includes(ep));

  if (status === 401) {
    if (isAuthEndpoint) {
      if (normalizedMessage.includes("invalid") || normalizedMessage.includes("credential")) {
        return "Email or password is incorrect.";
      }

      return "We couldn't verify your account. Please try again.";
    }

    if (
      normalizedMessage.includes("no token provided") ||
      normalizedMessage.includes("invalid token") ||
      normalizedMessage.includes("unauthorized") ||
      normalizedMessage.includes("session")
    ) {
      return "Your session has expired. Please log in again.";
    }
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status >= 500) {
    return "Something went wrong on our side. Please try again in a moment.";
  }

  return message || "Something went wrong";
};

const clearClientSession = () => {
  localStorage.removeItem("user");
  try {
    localStorage.removeItem("userData");
  } catch (e) {
    console.error("Error removing userData from localStorage:", e);
  }
};

let refreshPromise = null;

const refreshSession = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(data.message || "Failed to refresh session");
          error.code = response.status;
          throw error;
        }
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const apiClient = async (endpoint, options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  let url = `${API_URL}${endpoint}`;

  if (method === "GET" && !options.skipCacheBust) {
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}_=${Date.now()}`;
  }

  const response = await fetch(url, {
    ...options,
    method,
    cache: options.cache || "no-store",
    signal: options.signal,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return {};
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => endpoint.includes(ep));
    const rawMessage = data.message || data.error || "Something went wrong";

    if (response.status === 401 && !isAuthEndpoint && !options._retriedAfterRefresh) {
      try {
        await refreshSession();
        return apiClient(endpoint, { ...options, _retriedAfterRefresh: true });
      } catch {
        clearClientSession();
      }
    }

    const error = new Error(
      getFriendlyErrorMessage(response.status, rawMessage, endpoint),
    );
    error.code = response.status;
    error.info = data;
    error.rawMessage = rawMessage;

    if (response.status === 401 && !isAuthEndpoint) {
      clearClientSession();
    }

    throw error;
  }

  return data;
};
