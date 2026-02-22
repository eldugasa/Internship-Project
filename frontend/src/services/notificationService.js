import { apiClient } from './apiClient';

// Get notifications for current user
export const getNotifications = async (page = 1, limit = 20, unreadOnly = false) => {
  const params = new URLSearchParams({ page, limit });
  if (unreadOnly) params.append('unreadOnly', 'true');
  
  return apiClient(`/notifications?${params.toString()}`);
};

// Get unread count
export const getUnreadCount = async () => {
  return apiClient('/notifications/unread-count');
};

// Mark notification as read
export const markAsRead = async (id) => {
  return apiClient(`/notifications/${id}/read`, { method: 'PUT' });
};

// Mark all as read
export const markAllAsRead = async () => {
  return apiClient('/notifications/read-all', { method: 'PUT' });
};

// Delete notification
export const deleteNotification = async (id) => {
  return apiClient(`/notifications/${id}`, { method: 'DELETE' });
};