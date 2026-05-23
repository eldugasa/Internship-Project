import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2, X } from "lucide-react";
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "../../services/notificationService";
import {
  getNotificationBadges,
  getNotificationBaseRoute,
  getNotificationLinkByRole,
  getNotificationPresentation,
} from "./notificationMeta";

const notificationsQuery = (mode, limit = 5) => ({
  queryKey: ["notifications", "bell", mode, limit],
  queryFn: async ({ signal }) => {
    const response = await getNotifications(1, limit, false, { signal });
    const notificationsData = response.notifications || [];
    return notificationsData.filter(
      (notification, index, self) =>
        index === self.findIndex((item) => item.id === notification.id),
    );
  },
  staleTime: 1000 * 60,
  gcTime: 1000 * 60 * 5,
  refetchInterval: 30000,
});

const unreadCountQuery = (mode) => ({
  queryKey: ["notifications", "bell", mode, "unread-count"],
  queryFn: async ({ signal }) => {
    const response = await getUnreadCount({ signal });
    return response.count || 0;
  },
  staleTime: 30000,
  gcTime: 1000 * 60 * 5,
  refetchInterval: 30000,
});

const formatNotificationTime = (createdAt, fallbackTime) => {
  if (fallbackTime) {
    return fallbackTime;
  }
  if (!createdAt) {
    return "Recently";
  }
  return new Date(createdAt).toLocaleDateString();
};

const SharedNotificationBell = ({ baseRoute: baseRouteProp, mode = "manager" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const inferredMode = useMemo(() => {
    if (mode) {
      return mode;
    }
    if (location.pathname.startsWith("/admin")) return "admin";
    if (location.pathname.startsWith("/qa-tester")) return "qa";
    if (location.pathname.startsWith("/team-member")) return "teamMember";
    return "manager";
  }, [location.pathname, mode]);

  const baseRoute = baseRouteProp || getNotificationBaseRoute(inferredMode);

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch: refetchNotifications,
  } = useQuery({
    ...notificationsQuery(inferredMode),
  });

  const { data: unreadCount = 0 } = useQuery({
    ...unreadCountQuery(inferredMode),
  });

  const notificationsKey = ["notifications", "bell", inferredMode, 5];
  const unreadKey = ["notifications", "bell", inferredMode, "unread-count"];

  const markAsReadMutation = useMutation({
    mutationFn: async ({ notificationId }) => {
      await markAsRead(notificationId);
      return notificationId;
    },
    onMutate: async ({ notificationId, wasUnread }) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "bell", inferredMode] });

      const previousNotifications = queryClient.getQueryData(notificationsKey);
      const previousUnreadCount = queryClient.getQueryData(unreadKey);

      queryClient.setQueryData(notificationsKey, (current) =>
        Array.isArray(current)
          ? current.map((notification) =>
              notification.id === notificationId ? { ...notification, read: true } : notification,
            )
          : current,
      );

      if (wasUnread) {
        queryClient.setQueryData(unreadKey, (current) => Math.max(0, (current || 0) - 1));
      }

      return { previousNotifications, previousUnreadCount };
    },
    onError: (errorValue, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationsKey, context.previousNotifications);
      }
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(unreadKey, context.previousUnreadCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "bell", inferredMode] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await markAllAsRead();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "bell", inferredMode] });
      const previousNotifications = queryClient.getQueryData(notificationsKey);
      const previousUnreadCount = queryClient.getQueryData(unreadKey);

      queryClient.setQueryData(notificationsKey, (current) =>
        Array.isArray(current) ? current.map((notification) => ({ ...notification, read: true })) : current,
      );
      queryClient.setQueryData(unreadKey, 0);

      return { previousNotifications, previousUnreadCount };
    },
    onError: (errorValue, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationsKey, context.previousNotifications);
      }
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(unreadKey, context.previousUnreadCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "bell", inferredMode] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      await deleteNotification(notificationId);
      return notificationId;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "bell", inferredMode] });

      const previousNotifications = queryClient.getQueryData(notificationsKey);
      const previousUnreadCount = queryClient.getQueryData(unreadKey);
      const deletedNotification = Array.isArray(previousNotifications)
        ? previousNotifications.find((notification) => notification.id === notificationId)
        : null;

      queryClient.setQueryData(notificationsKey, (current) =>
        Array.isArray(current)
          ? current.filter((notification) => notification.id !== notificationId)
          : current,
      );

      if (deletedNotification && !deletedNotification.read) {
        queryClient.setQueryData(unreadKey, (current) => Math.max(0, (current || 0) - 1));
      }

      return { deletedNotification, previousNotifications, previousUnreadCount };
    },
    onError: (errorValue, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationsKey, context.previousNotifications);
      }
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(unreadKey, context.previousUnreadCount);
      }
      alert("Failed to delete notification");
    },
    onSettled: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["notifications", "bell", inferredMode] });
    },
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest(".notifications-container")) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const handleMarkAsRead = (notification) => {
    if (!notification?.id || notification.read) {
      return;
    }

    markAsReadMutation.mutate({
      notificationId: notification.id,
      wasUnread: !notification.read,
    });
  };

  const handleDeleteNotification = (event, notificationId) => {
    event.stopPropagation();
    if (!window.confirm("Delete this notification?")) {
      return;
    }
    setDeletingId(notificationId);
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification);
    setShowNotifications(false);
    const nextPath = getNotificationLinkByRole(inferredMode, notification) || `${baseRoute}/notifications`;
    navigate(nextPath);
  };

  const handleViewAllClick = () => {
    setShowNotifications(false);
    navigate(`${baseRoute}/notifications`);
  };

  return (
    <div className="relative notifications-container">
      <button
        onClick={() => setShowNotifications((value) => !value)}
        className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs text-[#194f87] hover:underline disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#194f87]" />
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <p className="mb-2">{error?.message || "Failed to load notifications"}</p>
                <button onClick={() => refetchNotifications()} className="text-xs text-[#194f87] hover:underline">
                  Retry
                </button>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => {
                const { Icon, iconBg, iconColor } = getNotificationPresentation(
                  inferredMode,
                  notification.type || "",
                );
                const badges = getNotificationBadges(inferredMode, notification);
                const isDeleting = deletingId === notification.id;

                return (
                  <div
                    key={notification.id}
                    className={`group relative border-b border-gray-100 p-4 transition hover:bg-gray-50 ${
                      !notification.read ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${iconBg}`}
                      >
                        <Icon className={`h-4 w-4 ${iconColor}`} />
                      </div>
                      <div className="flex-1 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                        <div className="flex items-start justify-between pr-6">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          {!notification.read && <span className="h-2 w-2 rounded-full bg-[#0f5841]" />}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{notification.message}</p>
                        <div className="mt-2 flex items-center gap-2">
                          {badges.map((badge) => (
                            <span
                              key={`${notification.id}-${badge.text}`}
                              className={`rounded px-2 py-0.5 text-xs ${badge.className}`}
                            >
                              {badge.text}
                            </span>
                          ))}
                          <span className="text-xs text-gray-400">
                            {formatNotificationTime(notification.createdAt, notification.time)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(event) => handleDeleteNotification(event, notification.id)}
                        disabled={isDeleting}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-50"
                        title="Delete notification"
                      >
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <Bell className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">No notifications</p>
                <p className="mt-1 text-xs text-gray-400">You're all caught up!</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-3 text-center">
            <button onClick={handleViewAllClick} className="text-sm font-medium text-[#194f87] hover:underline">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedNotificationBell;
