// src/services/usersService.js
import { apiClient } from './apiClient';
 
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
        return normalizedPermission.startsWith('!')
          ? `!${normalizedPermission.slice(1)}`
          : normalizedPermission;
      }),
  )];
};

// Helper to normalize user data
const normalizeUser = (user) => ({
  ...user,
  role: user.role?.toLowerCase().replace(/_/g, '-') || 'team-member',
  status: user.status?.toLowerCase() || 'active',
  permissionOverrides: normalizePermissionOverrides(
    user.permissionOverrides,
  ),
  permissions: normalizePermissions(user.permissions),
  effectivePermissions: normalizePermissions(user.effectivePermissions),
  fullName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  createdAt: user.createdAt || null,
  updatedAt: user.updatedAt || null
});
 
// Get all users (admin only)
export const getUsers = async ({ signal } = {}) => {
  const users = await apiClient('/users', { signal });
  return users.map(normalizeUser);
};
 
// Get user by ID
export const getUserById = async (id, { signal } = {}) => {
  const user = await apiClient(`/users/${id}`, { signal });
  return normalizeUser(user);
};
 
// Get current user profile
export const getCurrentUserProfile = async ({ signal } = {}) => {
  const user = await apiClient('/users/me', { signal });
  return normalizeUser(user);
};
 
// Update current user profile
export const updateCurrentUserProfile = async (data, { signal } = {}) => {
  const user = await apiClient('/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
    signal
  });
  return normalizeUser(user);
};
 
// Update current user password
export const updateCurrentUserPassword = async (data, { signal } = {}) => {
  return apiClient('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(data),
    signal
  });
};
 
// Update user role and extra permissions (admin only)
export const updateUserAccess = async (userId, { role, permissions, status }, { signal } = {}) => {
  const user = await apiClient(`/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({
      ...(role ? { role: role.toUpperCase().replace(/-/g, '_') } : {}),
      ...(permissions !== undefined ? { permissions: normalizePermissions(permissions) } : {}),
      ...(status !== undefined ? { status: status.toLowerCase() } : {}),
    }),
    signal
  });
  return normalizeUser(user);
};

export const updateUserRole = async (userId, role, { signal } = {}) => {
  return updateUserAccess(userId, { role }, { signal });
};
 
// Delete user (admin only)
export const deleteUser = async (userId, { signal } = {}) => {
  return apiClient(`/users/${userId}`, {
    method: 'DELETE',
    signal
  });
};
 
// Create new user (admin only)
export const createUser = async (userData, { signal } = {}) => {
  const user = await apiClient('/users', {
    method: 'POST',
    body: JSON.stringify({
      ...userData,
      role: userData.role?.toUpperCase().replace(/-/g, '_') || 'TEAM_MEMBER',
      permissions: normalizePermissions(userData.permissions),
    }),
    signal
  });
  return normalizeUser(user);
};
 
