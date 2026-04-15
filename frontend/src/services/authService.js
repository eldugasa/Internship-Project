// frontend/src/services/authService.js
import { apiClient } from "./apiClient";
 
// Normalize role to match frontend expectations (kebab-case)
const normalizeRole = (role = "") => {
  if (!role) return "team-member";
  return role.toLowerCase().replace(/_/g, "-");
};
 
export const loginApi = async (email, password, { signal } = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const data = await apiClient("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: normalizedEmail, password }),
    signal,
  });
 
  const user = {
    ...data.user,
    role: normalizeRole(data.user.role),
    token: data.token
  };
  
  localStorage.setItem("user", JSON.stringify(user));
  try { localStorage.setItem("userData", JSON.stringify(user)); } catch (e) {
    console.error("Error setting userData in localStorage:", e);
  }
  
  return user;
};
 
export const registerApi = async ({ name, email, password }, { signal } = {}) => {
  const data = await apiClient("/auth/register", {
    method: "POST",
    body: JSON.stringify({ 
      name, 
      email, 
      password, 
      role: "TEAM_MEMBER"
    }),
    signal,
  });
 
  let user;
 
  if (data?.token) {
    user = {
      ...data.user,
      role: normalizeRole(data.user.role),
      token: data.token
    };
  } else {
    const logged = await loginApi(email, password, { signal });
    user = {
      ...logged,
      role: normalizeRole(logged.role),
      token: logged.token || null
    };
  }
 
  localStorage.setItem("user", JSON.stringify(user));
  try { localStorage.setItem("userData", JSON.stringify(user)); } catch (e) {
    console.error("Error setting userData in localStorage:", e);
  }
 
  return user;
};
 
export const forgotPasswordApi = async (email, { signal } = {}) => {
  try {
    const data = await apiClient("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      signal,
    });
    return data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};
 
export const resetPasswordApi = async (token, newPassword, { signal } = {}) => {
  try {
    const data = await apiClient("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
      signal,
    });
    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};
 
export const logoutApi = () => {
  localStorage.removeItem("user");
  try { localStorage.removeItem("userData"); } catch (e) {
    console.error("Error removing userData from localStorage:", e);
  }
};
 
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};
