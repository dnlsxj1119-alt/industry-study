import React from 'react';
import { Home, LayoutDashboard, MessageSquare, Bookmark as BookmarkIcon, Calendar as CalendarIcon, Users, Mic } from 'lucide-react';
import { cn } from '../lib/utils';
import { TabId } from './Sidebar';

interface MobileNavProps {
  currentTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

export function MobileNav({ currentTab, onChangeTab }: MobileNavProps) {
  const menuItems: { icon: any, label: TabId }[] = [
    { icon: Home, label: '홈' },
    { icon: LayoutDashboard, label: '보드' },
    { icon: CalendarIcon, label: '달력' },
    { icon: BookmarkIcon, label: '북마크' },
    { icon: Mic, label: '발표자료' },
    { icon: Users, label: '멤버' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-2 pb-safe overflow-x-auto">
      <div className="flex justify-between items-center min-w-max px-2 space-x-4">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onChangeTab(item.label)}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-colors min-w-[3rem]",
              currentTab === item.label ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
