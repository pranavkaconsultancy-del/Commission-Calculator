import React from 'react';
import { Bell, X, Check, Trash2, Calendar } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsPanelProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onClose: () => void;
  darkMode: boolean;
}

export function NotificationsPanel({ 
  notifications, onMarkRead, onMarkAllRead, onClose, darkMode 
}: NotificationsPanelProps) {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className={`absolute right-0 top-12 w-80 rounded-2xl shadow-2xl border text-xs z-50 flex flex-col max-h-[400px] overflow-hidden ${
      darkMode ? 'bg-slate-800 border-slate-700 text-white shadow-black/40' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-1.5 font-black uppercase tracking-wider">
          <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Alert Center ({unreadCount})
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
            >
              Clear All
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-750 max-h-[300px]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No notifications yet</div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`p-3.5 transition-colors relative flex items-start gap-2.5 ${
                n.is_read ? 'opacity-60 hover:opacity-100' : 'bg-blue-500/5 hover:bg-blue-500/10'
              }`}
            >
              {!n.is_read && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold pr-4 leading-normal">{n.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</div>
                <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {n.created_at.substring(11, 16)}  •  {n.created_at.substring(0, 10)}
                </div>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => onMarkRead(n.id)}
                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 self-start"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
