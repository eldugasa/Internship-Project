// Use environment variable for API URL, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiClient = async (endpoint, options = {}) => {
  // Get token from localStorage (your AuthContext stores user with token)
  const userStr = localStorage.getItem("user");
  let token = null;
  
  try {
    const user = JSON.parse(userStr);
    token = user?.token;
  } catch (e) {
    // Ignore parse errors
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (res.status === 401) {
      localStorage.removeItem("user");
      window.location.href = '/login';
    }
    throw new Error(data.message || data.error || "Something went wrong");
  }

  return data;
};