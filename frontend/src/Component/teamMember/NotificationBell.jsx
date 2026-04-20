// src/components/teamMember/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  UserPlus,
  UserMinus,
  Loader2,
  Trash2,
  X
} from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../../services/notificationService';

// ============================================
// 1. QUERY DEFINITIONS
// ============================================

const notificationsQuery = (page = 1, limit = 5) => ({
  queryKey: ['notifications', page, limit],
  queryFn: async ({ signal }) => {
    const response = await getNotifications(page, limit, false, { signal });
    const notificationsData = response.notifications || [];
    // Remove duplicates by ID
    return notificationsData.filter(
      (notification, index, self) =>
        index === self.findIndex(n => n.id === notification.id)
    );
  },
  staleTime: 1000 * 60 * 1, // 1 minute
  gcTime: 1000 * 60 * 5,
});

const unreadCountQuery = () => ({
  queryKey: ['notifications', 'unread-count'],
  queryFn: async ({ signal }) => {
    const response = await getUnreadCount({ signal });
    return response.count || 0;
  },
  staleTime: 1000 * 30, // 30 seconds
  gcTime: 1000 * 60 * 5,
  refetchInterval: 30000, // Refetch every 30 seconds
});

// ============================================
// 2. COMPONENT
// ============================================

const NotificationBell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const isQATesterRoute = location.pathname.startsWith('/qa-tester');
  const baseRoute = isQATesterRoute ? '/qa-tester' : '/team-member';

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch: refetchNotifications
  } = useQuery({
    ...notificationsQuery(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount
  } = useQuery({
    ...unreadCountQuery(),
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async ({ notificationId }) => {
      await markAsRead(notificationId);
      return notificationId;
    },
    onMutate: async ({ notificationId, wasUnread }) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueryData(['notifications', 1, 5]);
      const previousUnreadCount = queryClient.getQueryData(['notifications', 'unread-count']);

      queryClient.setQueryData(['notifications', 1, 5], (old) => {
        if (!old) return old;
        return old.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        );
      });

      if (wasUnread) {
        queryClient.setQueryData(['notifications', 'unread-count'], (old) =>
          Math.max(0, (old || 0) - 1)
        );
      }

      return { previousNotifications, previousUnreadCount };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', 1, 5], context.previousNotifications);
      }
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(['notifications', 'unread-count'], context.previousUnreadCount);
      }
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      console.error('Error marking notification as read:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await markAllAsRead();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueryData(['notifications', 1, 5]);

      queryClient.setQueryData(['notifications', 1, 5], (old) => {
        if (!old) return old;
        return old.map(notif => ({ ...notif, read: true }));
      });

      queryClient.setQueryData(['notifications', 'unread-count'], 0);

      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', 1, 5], context.previousNotifications);
      }
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      console.error('Error marking all as read:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      await deleteNotification(notificationId);
      return notificationId;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueryData(['notifications', 1, 5]);
      const deletedNotification = previousNotifications?.find(n => n.id === notificationId);

      queryClient.setQueryData(['notifications', 1, 5], (old) => {
        if (!old) return old;
        return old.filter(notif => notif.id !== notificationId);
      });

      if (deletedNotification && !deletedNotification.read) {
        queryClient.setQueryData(['notifications', 'unread-count'], (old) =>
          Math.max(0, (old || 0) - 1)
        );
      }

      return { previousNotifications, deletedNotification };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', 1, 5], context.previousNotifications);
      }
      if (context?.deletedNotification && !context.deletedNotification.read) {
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      }
      console.error('Error deleting notification:', err);
      alert('Failed to delete notification');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      setDeletingId(null);
    },
  });

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleMarkAsRead = (notification) => {
    if (!notification?.id) return;
    markAsReadMutation.mutate({
      notificationId: notification.id,
      wasUnread: !notification.read,
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (e, notificationId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this notification?')) return;
    setDeletingId(notificationId);
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    handleMarkAsRead(notification);

    // Close dropdown
    setShowNotifications(false);

    // QA testers and team members share this bell, but they do not have
    // dedicated routes for every notification target.
    if (notification.link) {
      if (notification.link.includes('/teams') || notification.link.includes('/projects')) {
        navigate(`${baseRoute}/dashboard`);
      } else {
        // Fix legacy broken links in the database from comments that start with /tasks/
        let finalLink = notification.link;
        if (finalLink.startsWith('/tasks/')) {
          finalLink = `${baseRoute}${finalLink}`;
        }
        navigate(finalLink);
      }
      return;
    }

    // Safely parse notification.data in case it was cast to a string by the DB
    let parsedData = notification.data || {};
    if (typeof parsedData === 'string') {
      try { parsedData = JSON.parse(parsedData); } catch (e) {}
    }

    // Fallback if no link
    let path = `${baseRoute}/dashboard`;

    const taskId = notification.taskId || notification.task?.id || parsedData?.taskId;

    switch (notification.type) {
      case 'task_assigned':
      case 'task_assigned_to_me':
      case 'task_completed':
      case 'task_completed_by_me':
      case 'task_overdue':
      case 'task_overdue_for_me':
      case 'deadline_approaching':
      case 'comment_added':
        if (taskId) {
          path = `${baseRoute}/tasks/${taskId}`;
        } else {
          path = `${baseRoute}/tasks`;
        }
        break;

      case 'added_to_team':
      case 'member_joined':
      case 'member_removed':
      case 'project_created':
      case 'project_updated':
        path = `${baseRoute}/dashboard`;
        break;

      default:
        path = `${baseRoute}/dashboard`;
    }

    navigate(path);
  };

  const handleViewAllClick = () => {
    setShowNotifications(false);
    navigate(`${baseRoute}/notifications`);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
      case 'task_assigned_to_me':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' };
      case 'task_completed':
      case 'task_completed_by_me':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' };
      case 'task_overdue':
      case 'task_overdue_for_me':
        return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' };
      case 'deadline_approaching':
        return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' };
      case 'comment_added':
        return { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'added_to_team':
      case 'member_joined':
        return { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-50' };
      case 'member_removed':
        return { icon: UserMinus, color: 'text-red-500', bg: 'bg-red-50' };
      default:
        return { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50' };
    }
  };

  return (
    <div className="relative notifications-container">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs text-[#194f87] hover:underline disabled:opacity-50"
              >
                {markAllAsReadMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                ) : null}
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#194f87]" />
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <p className="mb-2">{error?.message || 'Failed to load notifications'}</p>
                <button
                  onClick={() => refetchNotifications()}
                  className="text-xs text-[#194f87] hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => {
                const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
                const isDeleting = deletingId === notification.id;

                return (
                  <div
                    key={notification.id}
                    className={`group relative p-4 border-b border-gray-100 hover:bg-gray-50 transition ${!notification.read ? 'bg-blue-50/30' : ''
                      }`}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex justify-between items-start pr-6">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          {!notification.read && <span className="w-2 h-2 bg-[#0f5841] rounded-full"></span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {notification.project && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {notification.project}
                            </span>
                          )}
                          {notification.task && (
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                              {notification.task}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {notification.time || new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        disabled={isDeleting}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full disabled:opacity-50"
                        title="Delete notification"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications</p>
                <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 text-center">
            <button
              onClick={handleViewAllClick}
              className="text-sm text-[#194f87] hover:underline font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
