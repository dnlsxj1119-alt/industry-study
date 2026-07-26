import React, { useState, useEffect } from 'react';
import { Home, LayoutDashboard, Calendar as CalendarIcon, Users, Mic, Sparkles, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { TabId } from './Sidebar';
import { api } from '../lib/supabase';
import { differenceInDays } from 'date-fns';

interface MobileNavProps {
  currentTab: TabId;
  onChangeTab: (tab: TabId) => void;
  currentMember: string;
}

export function MobileNav({ currentTab, onChangeTab, currentMember }: MobileNavProps) {
  const menuItems: { icon: any, label: TabId }[] = [
    { icon: Home, label: '홈' },
    { icon: LayoutDashboard, label: '보드' },
    { icon: BookOpen, label: '책' },
    { icon: CalendarIcon, label: '달력' },
    { icon: Mic, label: '발표자료' },
    { icon: Sparkles, label: '업데이트' },
    { icon: Users, label: '멤버' },
  ];

  const [hasNewUpdate, setHasNewUpdate] = useState(false);

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const updates = await api.getUpdates();
        if (updates.length > 0) {
          const latest = updates[0];
          const isNew = differenceInDays(new Date(), new Date(latest.created_at)) <= 7;
          if (isNew) {
            const lastSeenStr = localStorage.getItem(`last_seen_update_${currentMember}`);
            if (!lastSeenStr || new Date(lastSeenStr) < new Date(latest.created_at)) {
              setHasNewUpdate(true);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkUpdates();

    const handleUpdatesSeen = () => {
      setHasNewUpdate(false);
    };

    window.addEventListener('updates_seen', handleUpdatesSeen);
    return () => window.removeEventListener('updates_seen', handleUpdatesSeen);
  }, [currentMember]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-2 pb-safe overflow-x-auto">
      <div className="flex justify-between items-center min-w-max px-2 space-x-4">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              onChangeTab(item.label);
              if (item.label === '업데이트') {
                setHasNewUpdate(false);
                localStorage.setItem(`last_seen_update_${currentMember}`, new Date().toISOString());
              }
            }}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-colors min-w-[3rem]",
              currentTab === item.label ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <div className="relative">
              <item.icon className="w-6 h-6 mb-1" />
              {item.label === '업데이트' && hasNewUpdate && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </div>
            <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
