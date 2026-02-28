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
  // Keep legacy `userData` key in sync for layouts that read it
  try { localStorage.setItem("userData", JSON.stringify(user)); } catch (e) {}
  
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

  // Backend should return { token, user }. If token is missing, perform login to obtain it.
  let user;

  if (data?.token) {
    user = {
      ...data.user,
      role: normalizeRole(data.user.role),
      token: data.token
    };
  } else {
    // Fallback: immediately log in to get a token
    const logged = await loginApi(email, password);
    user = {
      ...logged,
      role: normalizeRole(logged.role),
      token: logged.token || null
    };
  }

  localStorage.setItem("user", JSON.stringify(user));
  try { localStorage.setItem("userData", JSON.stringify(user)); } catch (e) {}

  return user;
};

// ✅ ADD THIS FUNCTION - Forgot Password
export const forgotPasswordApi = async (email) => {
  try {
    const data = await apiClient("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

// ✅ ADD THIS FUNCTION - Reset Password (with token)
export const resetPasswordApi = async (token, newPassword) => {
  try {
    const data = await apiClient("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

export const logoutApi = () => {
  localStorage.removeItem("user");
  try { localStorage.removeItem("userData"); } catch (e) {}
};

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};