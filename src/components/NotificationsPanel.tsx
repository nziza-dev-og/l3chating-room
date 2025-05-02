import  { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
import { Notification, subscribeToNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../services/NotificationService';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser || !isOpen) return;

    setLoading(true);
    const unsubscribe = subscribeToNotifications(currentUser.uid, (notificationsList) => {
      setNotifications(notificationsList);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, isOpen]);

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    
    try {
      await markAllNotificationsAsRead(currentUser.uid);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex justify-end">
      <div className="w-80 md:w-96 bg-white h-full shadow-lg flex flex-col max-w-full animate-slide-in-right">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="flex space-x-2">
            {notifications.some(n => !n.isRead) && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-32 flex justify-center items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex justify-between">
                    <h3 className="font-medium text-sm">{notification.title}</h3>
                    <span className="text-xs text-gray-500">
                      {notification.timestamp && notification.timestamp.toDate 
                        ? new Date(notification.timestamp.toDate()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                  {!notification.isRead && (
                    <div className="mt-2 flex justify-end">
                      <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 