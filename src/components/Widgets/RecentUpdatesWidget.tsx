import React, { useState, useEffect } from 'react';
import { AppUpdate } from '../../types';
import { api } from '../../lib/supabase';
import { Bell, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface RecentUpdatesWidgetProps {
  onGoToUpdates: () => void;
}

export function RecentUpdatesWidget({ onGoToUpdates }: RecentUpdatesWidgetProps) {
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUpdates = async () => {
      try {
        const data = await api.getUpdates();
        setUpdates(data.slice(0, 3)); // Top 3
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUpdates();
  }, []);

  const isNew = (dateStr: string) => differenceInDays(new Date(), new Date(dateStr)) <= 7;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (updates.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
      
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <Bell className="w-4 h-4 text-blue-600" />
          </div>
          최근 업데이트
        </h3>
        <button 
          onClick={onGoToUpdates}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center transition-colors"
        >
          전체보기 <ChevronRight className="w-4 h-4 ml-0.5" />
        </button>
      </div>
      
      <div className="space-y-3">
        {updates.map(update => (
          <div 
            key={update.id}
            onClick={onGoToUpdates}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center flex-1 min-w-0 pr-4">
              <span className="text-sm font-medium text-gray-900 truncate">
                {update.title}
              </span>
              {isNew(update.created_at) && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white tracking-wide shrink-0">
                  NEW
                </span>
              )}
            </div>
            <div className="text-xs font-medium text-gray-400 mt-1 sm:mt-0 shrink-0">
              {formatDistanceToNow(new Date(update.created_at), { addSuffix: true, locale: ko })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
