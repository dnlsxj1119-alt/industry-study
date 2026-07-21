import React, { useState, useEffect } from 'react';
import { Home, LayoutDashboard, Bookmark as BookmarkIcon, Users, Calendar as CalendarIcon, Mic, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, getMemberColorClasses, getMemberTextClass } from '../lib/utils';
import { Member } from '../types';
import { api } from '../lib/supabase';
import { differenceInDays } from 'date-fns';

export type TabId = '홈' | '보드' | '달력' | '북마크' | '멤버' | '발표자료' | '업데이트';

interface SidebarProps {
  currentMember: Member;
  onChangeMember: () => void;
  currentTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

export function Sidebar({ currentMember, onChangeMember, currentTab, onChangeTab }: SidebarProps) {
  const menuItems: { icon: any, label: TabId }[] = [
    { icon: Home, label: '홈' },
    { icon: LayoutDashboard, label: '보드' },
    { icon: CalendarIcon, label: '달력' },
    { icon: Mic, label: '발표자료' },
    { icon: Users, label: '멤버' },
  ];

  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  }, [collapsed]);

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
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen border-r border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 shrink-0 relative transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 w-6 h-6 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors z-10"
        title={collapsed ? "펼치기" : "접기"}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div className="p-6 overflow-hidden">
        <h1 className={cn(
          "font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap transition-all duration-200",
          collapsed ? "text-2xl" : "text-2xl"
        )}>
          {collapsed ? "IS" : "Industry Study"}
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onChangeTab(item.label)}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
              collapsed && "justify-center px-0",
              currentTab === item.label
                ? "bg-primary-50 text-primary-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className={cn("w-5 h-5 shrink-0", !collapsed && "mr-3", currentTab === item.label ? "text-primary-600" : "text-gray-400")} />
            {!collapsed && item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
        <button
          onClick={() => {
            onChangeTab('업데이트');
            setHasNewUpdate(false);
            localStorage.setItem(`last_seen_update_${currentMember}`, new Date().toISOString());
          }}
          title={collapsed ? "업데이트" : undefined}
          className={cn(
            "relative flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
            collapsed ? "justify-center px-0" : "justify-between",
            currentTab === '업데이트'
              ? "bg-primary-50 text-primary-600"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <div className="flex items-center">
            <Sparkles className={cn("w-5 h-5 shrink-0", !collapsed && "mr-3", currentTab === '업데이트' ? "text-primary-600" : "text-gray-400")} />
            {!collapsed && '업데이트'}
          </div>
          {!collapsed && hasNewUpdate && (
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">NEW</span>
          )}
          {collapsed && hasNewUpdate && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        <div className={cn(
          "flex items-center px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 shadow-sm",
          collapsed ? "justify-center px-0" : "justify-between"
        )}>
          <div className="flex items-center">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border shrink-0", getMemberColorClasses(currentMember))}>
              {currentMember[0]}
            </div>
            {!collapsed && (
              <span className={cn("ml-3 font-bold text-sm", getMemberTextClass(currentMember))}>{currentMember}</span>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onChangeMember}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200 transition-colors"
              title="멤버 변경"
            >
              <Users className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
