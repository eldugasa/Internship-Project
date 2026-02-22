import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  UserPlus,
  Loader2
} from 'lucide-react';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead 
} from '../../services/notificationService';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
       
      }
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNotifications(1, 5);
      setNotifications(response.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // Mark notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (err) {
      
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification.id);
    if (notification.link) navigate(notification.link);
    setShowNotifications(false);
  };

  // Navigate to full notifications page - WITH DEBUGGING
  const handleViewAllClick = (e) => {
    // Close the dropdown
    setShowNotifications(false);
    
    
  
    
    try {
     
      navigate('/team-member/notifications');
      navigate('/team-member/notifications', { replace: true });
      
    } catch (err) {
      console.error('❌ Navigation error:', err);
    }
    
    
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch(type) {
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
        return { icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-50' };
      default:
        return { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50' };
    }
  };

  return (
    <div className="relative notifications-container">
      <button
        onClick={() => {
          console.log('Bell icon clicked, toggling dropdown');
          setShowNotifications(!showNotifications);
        }}
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
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs text-[#194f87] hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#194f87]" />
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <p className="mb-2">{error}</p>
                <button onClick={fetchNotifications} className="text-xs text-[#194f87] hover:underline">
                  Retry
                </button>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => {
                const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                      !notification.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
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
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">No notifications</div>
            )}
          </div>

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