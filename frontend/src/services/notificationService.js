// src/services/notificationsService.js
import { apiClient } from './apiClient';
 
// Get notifications for current user
export const getNotifications = async (page = 1, limit = 20, unreadOnly = false, { signal } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (unreadOnly) params.append('unreadOnly', 'true');
  
  return apiClient(`/notifications?${params.toString()}`, { signal });
};
 
// Get unread count
export const getUnreadCount = async ({ signal } = {}) => {
  return apiClient('/notifications/unread-count', { signal });
};
 
// Mark notification as read
export const markAsRead = async (id, { signal } = {}) => {
  return apiClient(`/notifications/${id}/read`, { method: 'PUT', signal });
};
 
// Mark all as read
export const markAllAsRead = async ({ signal } = {}) => {
  return apiClient('/notifications/read-all', { method: 'PUT', signal });
};
 
// Delete single notification
export const deleteNotification = async (id, { signal } = {}) => {
  return apiClient(`/notifications/${id}`, { method: 'DELETE', signal });
};
 
// Delete all notifications
export const clearAllNotifications = async ({ signal } = {}) => {
  return apiClient('/notifications', { method: 'DELETE', signal });
};