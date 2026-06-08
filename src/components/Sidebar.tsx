import React, { useState, useEffect } from 'react';
import { Home, LayoutDashboard, Bookmark as BookmarkIcon, Users, Calendar as CalendarIcon, Mic, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const updates = await api.getUpdates();
        if (updates.length > 0) {
          const latest = updates[0];
          const isNew = differenceInDays(new Date(), new Date(latest.created_at)) <= 7;
          if (isNew) {
            const lastSeenStr = localStorage.getItem('last_seen_update');
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
  }, []);

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen border-r border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 shrink-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
          Industry Study
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onChangeTab(item.label)}
            className={cn(
              "flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
              currentTab === item.label 
                ? "bg-primary-50 text-primary-600" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className={cn("w-5 h-5 mr-3", currentTab === item.label ? "text-primary-600" : "text-gray-400")} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
        <button
          onClick={() => onChangeTab('업데이트')}
          className={cn(
            "flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold shadow-sm",
            currentTab === '업데이트'
              ? "bg-blue-600 text-white"
              : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 border border-blue-100"
          )}
        >
          <div className="flex items-center">
            <Sparkles className={cn("w-5 h-5 mr-3", currentTab === '업데이트' ? "text-white" : "text-blue-600")} />
            업데이트
          </div>
          {hasNewUpdate && (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide animate-pulse",
              currentTab === '업데이트' ? "bg-white text-blue-600" : "bg-blue-600 text-white"
            )}>
              NEW
            </span>
          )}
        </button>

        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
          <div className="flex items-center">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border", getMemberColorClasses(currentMember))}>
              {currentMember[0]}
            </div>
            <span className={cn("ml-3 font-bold text-sm", getMemberTextClass(currentMember))}>{currentMember}</span>
          </div>
          <button 
            onClick={onChangeMember}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200 transition-colors"
            title="멤버 변경"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
