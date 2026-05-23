import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Bell, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { getNotifications, markAsRead } from "../../services/notificationService";
import {
  getNotificationBadges,
  getNotificationPresentation,
  notificationPageConfigs,
} from "./notificationMeta";

const formatNotificationDate = (createdAt, mode) => {
  if (mode === "qa") {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  }

  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

const NotificationsPage = ({ mode }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const config = notificationPageConfigs[mode] || notificationPageConfigs.manager;

  const notificationsQuery = useQuery({
    queryKey: ["notifications-page", mode, page],
    queryFn: ({ signal }) => getNotifications(page, 20, false, { signal }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-page", mode] });
    },
  });

  const notifications = useMemo(
    () => notificationsQuery.data?.notifications || [],
    [notificationsQuery.data],
  );
  const pagination = notificationsQuery.data?.pagination || { total: 0, pages: 1 };

  if (notificationsQuery.isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#194f87]" />
      </div>
    );
  }

  return (
    <div className={mode === "qa" ? "max-w-4xl mx-auto py-6" : "min-h-screen bg-gray-50"}>
      {config.backPath ? (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <button
                onClick={() => navigate(config.backPath)}
                className="p-2 hover:bg-gray-100 rounded-lg mr-4"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{config.title}</h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-[#4DA5AD]" />
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
        </div>
      )}

      <div className={config.backPath ? "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
        {notificationsQuery.isError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {notificationsQuery.error?.message || "Failed to load notifications"}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p>{config.emptyMessage}</p>
          </div>
        ) : (
          <div className={mode === "qa" ? "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" : "space-y-4"}>
            <div className={mode === "qa" ? "divide-y divide-gray-100" : "space-y-4"}>
              {notifications.map((notification) => {
                const { Icon, iconBg, iconColor } = getNotificationPresentation(mode, notification.type || "");
                const badges = getNotificationBadges(mode, notification);

                if (mode === "qa") {
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 flex items-start gap-4 transition-colors ${!notification.read ? "bg-[#4DA5AD]/10" : "hover:bg-gray-50"}`}
                    >
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <span className="text-xs text-gray-400 mt-2 block flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatNotificationDate(notification.createdAt, mode)}
                        </span>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          className="text-[#4DA5AD] hover:text-[#3c8a91] transition"
                          title="Mark as read"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={notification.id}
                    className={`bg-white rounded-lg shadow-sm border ${!notification.read ? "border-l-4 border-l-[#194f87]" : "border-gray-200"} p-4 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            <p className="text-gray-600 mt-1">{notification.message}</p>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              className="text-xs text-[#194f87] hover:underline whitespace-nowrap ml-4"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <span className="text-xs text-gray-400">
                            {formatNotificationDate(notification.createdAt, mode)}
                          </span>
                          {badges.map((badge) => (
                            <span
                              key={`${notification.id}-${badge.text}`}
                              className={`text-xs px-2 py-0.5 rounded ${badge.className}`}
                            >
                              {badge.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
