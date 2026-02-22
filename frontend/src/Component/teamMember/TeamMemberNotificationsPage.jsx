import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  MessageSquare,
  UserPlus,
  FolderKanban,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { getNotifications, markAsRead } from '../../services/notificationService';

const TeamMemberNotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchNotifications = async (pageNum = page) => {
    try {
      setLoading(true);
      const response = await getNotifications(pageNum, 20);
      setNotifications(response.notifications || []);
      setPagination(response.pagination || { total: 0, pages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'task_assigned':
      case 'task_assigned_to_me':
        return CheckCircle;
      case 'task_completed':
      case 'task_completed_by_me':
        return CheckCircle;
      case 'task_overdue':
      case 'task_overdue_for_me':
        return AlertCircle;
      case 'deadline_approaching':
        return Clock;
      case 'comment_added':
        return MessageSquare;
      case 'added_to_team':
        return UserPlus;
      default:
        return Bell;
    }
  };

  const getIconColor = (type) => {
    if (type.includes('assigned') || type.includes('completed')) return 'text-green-500';
    if (type.includes('overdue')) return 'text-red-500';
    if (type.includes('deadline')) return 'text-yellow-500';
    if (type.includes('comment')) return 'text-blue-500';
    if (type.includes('added_to_team')) return 'text-purple-500';
    return 'text-gray-500';
  };

  const getIconBg = (type) => {
    if (type.includes('assigned') || type.includes('completed')) return 'bg-green-50';
    if (type.includes('overdue')) return 'bg-red-50';
    if (type.includes('deadline')) return 'bg-yellow-50';
    if (type.includes('comment')) return 'bg-blue-50';
    if (type.includes('added_to_team')) return 'bg-purple-50';
    return 'bg-gray-50';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#194f87]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/team-member/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg mr-4"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Team Member Notifications</h1>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow-sm border ${
                    !notification.read ? 'border-l-4 border-l-[#194f87]' : 'border-gray-200'
                  } p-4 hover:shadow-md transition-shadow`}
                >
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${getIconBg(notification.type)} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${getIconColor(notification.type)}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-[#194f87] hover:underline whitespace-nowrap ml-4"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-gray-400">
                          {formatDate(notification.createdAt)}
                        </span>
                        {notification.project && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                            {notification.project}
                          </span>
                        )}
                        {notification.task && (
                          <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded">
                            {notification.task}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
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

export default TeamMemberNotificationsPage;