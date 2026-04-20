import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNotifications, markAsRead } from '../../services/notificationService';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const QATesterNotificationsPage = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: ({ signal }) => getNotifications(1, 20, false, { signal }),
  });

  const notifications = data?.notifications || [];

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      refetch();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading notifications...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-[#4DA5AD]" />
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isError ? (
          <div className="p-8 text-center text-red-600">
            <p>{error?.message || 'Failed to load notifications.'}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-sm text-[#4DA5AD] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notifications available.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 flex items-start gap-4 transition-colors ${!notif.read ? 'bg-[#4DA5AD]/10' : 'hover:bg-gray-50'}`}
              >
                <div className="flex-1">
                  <h3 className={`text-sm font-medium ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  <span className="text-xs text-gray-400 mt-2 block flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {!notif.read && (
                  <button 
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="text-[#4DA5AD] hover:text-[#3c8a91] transition"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QATesterNotificationsPage;
