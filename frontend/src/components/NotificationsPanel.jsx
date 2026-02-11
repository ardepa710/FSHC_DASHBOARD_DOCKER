import { Bell, X, Check, CheckCheck } from 'lucide-react';
import useStore from '../store/useStore';
import { useNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllRead } from '../hooks/useData';
import clsx from 'clsx';

const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHr > 0) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'just now';
};

const notificationIcons = {
  TASK_ASSIGNED: '📋',
  TASK_UPDATED: '✏️',
  TASK_COMPLETED: '✅',
  COMMENT_ADDED: '💬',
  MENTION: '@',
  DUE_DATE_REMINDER: '⏰',
  DEPENDENCY_RESOLVED: '🔓',
};

export default function NotificationsPanel() {
  const { isNotificationsPanelOpen, closeNotificationsPanel } = useStore();
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadData } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = unreadData?.count || 0;

  const handleMarkRead = async (id) => {
    try {
      await markRead.mutateAsync(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (!isNotificationsPanelOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-[90]"
        onClick={closeNotificationsPanel}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 w-full sm:w-[380px] h-screen bg-[#111827] border-l border-[#1e2640] z-[91] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1e2640] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#6c8cff]" />
            <h2 className="text-[15px] font-semibold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-[#6c8cff] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                aria-label="Mark all notifications as read"
                className="text-[11px] text-[#6c8cff] hover:text-white transition-[color] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c8cff] rounded"
              >
                <CheckCheck size={16} aria-hidden="true" />
              </button>
            )}
            <button
              onClick={closeNotificationsPanel}
              aria-label="Close notifications panel"
              className="text-[#8892a4] hover:text-white transition-[color] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c8cff] rounded"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-[#8892a4]">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#8892a4]">
              <Bell size={32} className="mb-2 opacity-50" />
              <p className="text-[13px]">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1e2640]">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={clsx(
                    'p-4 hover:bg-[#1a2035] transition-colors cursor-pointer',
                    !notification.read && 'bg-[rgba(108,140,255,0.05)]'
                  )}
                  onClick={() => !notification.read && handleMarkRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="text-lg">
                      {notificationIcons[notification.type] || '📌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white font-medium truncate">
                        {notification.title}
                      </p>
                      <p className="text-[12px] text-[#8892a4] mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-[#556] mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-[#6c8cff] shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Bell icon with badge for TopBar
export function NotificationBell() {
  const { openNotificationsPanel } = useStore();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count || 0;

  return (
    <button
      onClick={openNotificationsPanel}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      className="relative p-2 text-[#8892a4] hover:text-white transition-[color] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c8cff] rounded"
    >
      <Bell size={20} aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#ef4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center" aria-hidden="true">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
