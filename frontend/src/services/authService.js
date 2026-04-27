// frontend/src/services/authService.js
import { apiClient } from "./apiClient";
 
// Normalize role to match frontend expectations (kebab-case)
const normalizeRole = (role = "") => {
  if (!role) return "team-member";
  return role.toLowerCase().replace(/_/g, "-");
};

const normalizePermissions = (permissions = []) => {
  if (!Array.isArray(permissions)) return [];
  return [...new Set(
    permissions
      .filter(Boolean)
      .map((permission) => permission.toString().trim().toLowerCase()),
  )];
};

const normalizePermissionOverrides = (permissions = []) => {
  if (!Array.isArray(permissions)) return [];
  return [...new Set(
    permissions
      .filter(Boolean)
      .map((permission) => {
        const normalizedPermission = permission.toString().trim().toLowerCase();
        return normalizedPermission.startsWith("!")
          ? `!${normalizedPermission.slice(1)}`
          : normalizedPermission;
      }),
  )];
};

const normalizeUser = (user = {}) => ({
  ...user,
  role: normalizeRole(user.role),
  status: user.status?.toLowerCase() || "active",
  permissionOverrides: normalizePermissionOverrides(
    user.permissionOverrides,
  ),
  permissions: normalizePermissions(user.permissions),
  effectivePermissions: normalizePermissions(user.effectivePermissions),
});

export const persistCurrentUser = (user) => {
  const normalizedUser = normalizeUser(user);

  localStorage.setItem("user", JSON.stringify(normalizedUser));
  try {
    localStorage.setItem("userData", JSON.stringify(normalizedUser));
  } catch (e) {
    console.error("Error setting userData in localStorage:", e);
  }

  return normalizedUser;
};
 
export const loginApi = async (email, password, { signal } = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const data = await apiClient("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: normalizedEmail, password }),
    signal,
  });
 
  const user = persistCurrentUser({
    ...data.user,
    token: data.token,
  });
  
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

export const fetchCurrentUserApi = async ({ signal } = {}) => {
  const user = await apiClient("/users/me", { signal });
  return persistCurrentUser({
    ...user,
    token: getCurrentUser()?.token,
  });
};
 
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? normalizeUser(JSON.parse(userStr)) : null;
  } catch {
    return null;
  }
};
