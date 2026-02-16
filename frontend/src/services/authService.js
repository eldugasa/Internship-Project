// frontend/src/services/authService.js
import { apiClient } from "./apiClient";

// Normalize role to match frontend expectations (kebab-case)
const normalizeRole = (role = "") => {
  if (!role) return "team-member";
  return role.toLowerCase().replace(/_/g, "-");
};

export const loginApi = async (email, password) => {
  const data = await apiClient("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Backend returns { token, user: { id, name, email, role } }
  const user = {
    ...data.user,
    role: normalizeRole(data.user.role),
    token: data.token
  };
  
  localStorage.setItem("user", JSON.stringify(user));
  
  return user;
};

export const registerApi = async ({ name, email, password }) => {
  const data = await apiClient("/auth/register", {
    method: "POST",
    body: JSON.stringify({ 
      name, 
      email, 
      password, 
      role: "TEAM_MEMBER" // Default role
    }),
  });

  // Backend returns { message, user: { id, email, role, name } }
  // Note: Register might not return token, so user might need to login separately
  const user = {
    ...data.user,
    role: normalizeRole(data.user.role)
  };
  
  localStorage.setItem("user", JSON.stringify(user));
  
  return user;
};

export const logoutApi = () => {
  localStorage.removeItem("user");
};

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};