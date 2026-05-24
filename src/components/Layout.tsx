import React, { ReactNode } from 'react';
import { Sidebar, TabId } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Member } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentMember: Member;
  onChangeMember: () => void;
  currentTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

export function Layout({ children, currentMember, onChangeMember, currentTab, onChangeTab }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      <Sidebar 
        currentMember={currentMember} 
        onChangeMember={onChangeMember} 
        currentTab={currentTab}
        onChangeTab={onChangeTab}
      />
      
      <main className="flex-1 flex flex-col md:flex-row pb-20 md:pb-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
          <div className="max-w-4xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
      
      <MobileNav 
        currentTab={currentTab}
        onChangeTab={onChangeTab}
      />
    </div>
  );
}
