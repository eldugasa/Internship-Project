// src/services/usersService.js
import { apiClient } from './apiClient';

// Helper to normalize user data
const normalizeUser = (user) => ({
  ...user,
  role: user.role?.toLowerCase().replace(/_/g, '-') || 'team-member',
  fullName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : null,
  updatedAt: user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : null
});

// Get all users (admin only)
export const getUsers = async () => {
  const users = await apiClient('/users');
  return users.map(normalizeUser);
};

// Get user by ID
export const getUserById = async (id) => {
  const user = await apiClient(`/users/${id}`);
  return normalizeUser(user);
};

// Get current user profile
export const getCurrentUserProfile = async () => {
  const user = await apiClient('/users/me');
  return normalizeUser(user);
};

// Update current user profile
export const updateCurrentUserProfile = async (data) => {
  const user = await apiClient('/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return normalizeUser(user);
};

// Update current user password
export const updateCurrentUserPassword = async (data) => {
  return apiClient('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// Update user role (admin only)
export const updateUserRole = async (userId, role) => {
  const user = await apiClient(`/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role: role.toUpperCase().replace(/-/g, '_') })
  });
  return normalizeUser(user);
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  return apiClient(`/users/${userId}`, {
    method: 'DELETE'
  });
};

// Create new user (admin only)
export const createUser = async (userData) => {
  const user = await apiClient('/users', {
    method: 'POST',
    body: JSON.stringify({
      ...userData,
      role: userData.role?.toUpperCase().replace(/-/g, '_') || 'TEAM_MEMBER'
    })
  });
  return normalizeUser(user);
};