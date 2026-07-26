import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { api, supabase, isSupabaseConfigured } from '../lib/supabase';
import { Member, Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NotificationBellProps {
  currentMember: Member | null;
  onNotificationClick: (notification: Notification) => void;
}

export function NotificationBell({ currentMember, onNotificationClick }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!currentMember || !isSupabaseConfigured) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      const data = await api.getNotifications(currentMember);
      setNotifications(data);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase.channel(`notifications-${currentMember}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${currentMember}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${currentMember}`
        },
        (payload) => {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentMember]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await api.markNotificationAsRead(notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    }
    setIsOpen(false);
    onNotificationClick(notification);
  };

  if (!currentMember) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 text-gray-600 transition-all pointer-events-auto rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:shadow hover:text-gray-900 active:scale-95 ${isOpen ? 'ring-2 ring-primary-100 border-primary-300' : ''}`}
      >
        <Bell className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white border-2 border-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 pointer-events-auto ring-1 ring-black ring-opacity-5">
          <div className="px-4 py-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm">
            <h3 className="font-bold text-gray-900 text-sm tracking-tight">알림</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-primary-600 font-semibold bg-primary-50 px-2 py-0.5 rounded-full">{unreadCount}개 안 읽음</span>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-600 text-sm font-medium">새로운 알림이 없습니다</p>
                <p className="text-gray-400 text-xs mt-1">게시글이나 책 기록에 댓글이 달리면 이곳에 표시됩니다</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => (
                  <div 
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50 flex items-start space-x-3 group ${!n.is_read ? 'bg-primary-50/40' : 'opacity-75'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13.5px] leading-snug text-gray-900 ${!n.is_read ? 'font-semibold' : 'font-medium group-hover:text-gray-900'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5 font-medium">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ko })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0 shadow-sm ring-2 ring-primary-100"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
