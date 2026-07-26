import React, { useState, useEffect } from 'react';
import { Post, Book, Member, WeeklyGoal } from '../../types';
import { MEMBERS, ADMIN_MEMBER } from '../../constants/members';
import { cn, getMemberColorClasses, getMemberBgClass, getMemberTextClass } from '../../lib/utils';
import { isSameWeek, startOfWeek, format } from 'date-fns';
import { api } from '../../lib/supabase';
import { Edit2, X } from 'lucide-react';

interface WeeklyStatusProps {
  posts: Post[];
  books?: Book[];
  currentMember?: Member; // Added optional to support existing usage but allow admin check
}

export function WeeklyStatus({ posts, books = [], currentMember }: WeeklyStatusProps) {
  const members: Member[] = [...MEMBERS];
  const [targetPerMember, setTargetPerMember] = useState(5);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(5);
  
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekStartDateStr = format(weekStart, 'yyyy-MM-dd');

  useEffect(() => {
    const fetchGoal = async () => {
      const goal = await api.getWeeklyGoal(weekStartDateStr);
      setTargetPerMember(goal);
      setEditValue(goal);
    };
    fetchGoal();
  }, [weekStartDateStr]);

  const handleSaveGoal = async () => {
    try {
      await api.setWeeklyGoal(weekStartDateStr, editValue);
      setTargetPerMember(editValue);
      setIsEditing(false);
    } catch (e) {
      alert('목표 저장 중 오류가 발생했습니다.');
    }
  };
  
  // Filter posts for this week using study_date
  const thisWeekPosts = posts.filter(p => {
    // Fallback to created_at if study_date doesn't exist yet (for safety)
    const dateToUse = p.study_date ? new Date(p.study_date) : new Date(p.created_at);
    return isSameWeek(dateToUse, now, { weekStartsOn: 1 }); // Assuming week starts on Monday
  });

  // Only 읽는 중 / 완독 books have a study_date and count toward contribution stats
  // ('읽고 싶은 책' entries are excluded entirely).
  const thisWeekBooks = books.filter(b => {
    if (b.status === '읽고 싶은 책' || !b.study_date) return false;
    return isSameWeek(new Date(b.study_date), now, { weekStartsOn: 1 });
  });

  // Calculate contribution points per member (falls back to 1 point per post for legacy data)
  const uploadsByMember = members.reduce((acc, member) => {
    const postPoints = thisWeekPosts
      .filter(p => p.author === member)
      .reduce((sum, p) => sum + (p.contribution_point ?? 1), 0);
    const bookPoints = thisWeekBooks
      .filter(b => b.member === member)
      .reduce((sum, b) => sum + (b.contribution_point ?? 1), 0);
    acc[member] = postPoints + bookPoints;
    return acc;
  }, {} as Record<Member, number>);

  const isAdmin = currentMember === ADMIN_MEMBER;

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100 relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-900">
          이번 주 멤버별 기여도 현황
        </h3>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
            목표: {targetPerMember}점
          </span>
          {isAdmin && (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="주간 목표 설정"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {members.map(member => {
          const count = uploadsByMember[member] || 0;
          const isDone = count >= targetPerMember;
          const overAchievement = count > targetPerMember;
          const progressPercentage = Math.min((count / targetPerMember) * 100, 100);
          const overPercentage = overAchievement ? Math.round((count / targetPerMember) * 100) : 0;
          
          return (
            <div key={member} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] mr-2 border", getMemberColorClasses(member))}>
                    {member[0]}
                  </div>
                  <span className={cn("text-sm font-bold", getMemberTextClass(member))}>{member}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-600">
                    {count} / {targetPerMember}
                  </span>
                  {overAchievement ? (
                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-md border border-primary-100">{overPercentage}% 초과달성🔥</span>
                  ) : isDone ? (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">완료</span>
                  ) : null}
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={cn("h-1.5 rounded-full transition-all duration-500 ease-out", isDone ? 'bg-gray-800' : getMemberBgClass(member))}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden card-shadow">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">이번 주 목표 설정</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                목표 기여도 (점)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={editValue}
                onChange={(e) => setEditValue(Number(e.target.value))}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors font-medium text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-2">
                * 이 목표는 모든 멤버에게 동일하게 적용됩니다.
              </p>
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveGoal}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
