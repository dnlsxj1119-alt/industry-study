import React, { useState } from 'react';
import { Post, Member } from '../types';
import { PostCard } from '../components/Board/PostCard';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn, getMemberBgClass } from '../lib/utils';

interface CalendarPageProps {
  posts: Post[];
  currentMember: Member;
  commentCounts: Record<string, number>;
  bookmarkedPostIds: Set<string>;
  onToggleBookmark: (e: React.MouseEvent, postId: string) => void;
  onPostClick: (post: Post) => void;
  onEdit: (post: Post) => void;
}

export function CalendarPage({ posts, currentMember, commentCounts, bookmarkedPostIds, onToggleBookmark, onPostClick, onEdit }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAuthor, setSelectedAuthor] = useState<Member | '전체'>('전체');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Filter posts for the selected date and author
  const filteredPosts = posts.filter(post => {
    const isSame = isSameDay(new Date(post.created_at), selectedDate);
    const authorMatch = selectedAuthor === '전체' || post.author === selectedAuthor;
    return isSame && authorMatch;
  });

  const getAuthorsForDate = (date: Date): Member[] => {
    const authors = posts
      .filter(post => isSameDay(new Date(post.created_at), date))
      .map(post => post.author);
    return Array.from(new Set(authors));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow">
        <div className="flex justify-between items-center mb-6">
          <button onClick={prevMonth} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100">&lt;</button>
          <h2 className="text-xl font-bold text-gray-900">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </h2>
          <button onClick={nextMonth} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100">&gt;</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-sm font-semibold text-gray-500 py-2">{day}</div>
          ))}
          {days.map((day, idx) => {
            const authors = getAuthorsForDate(day);
            const isSelected = isSameDay(day, selectedDate);
            return (
              <div 
                key={idx} 
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "p-1 md:p-2 aspect-square flex flex-col justify-center items-center rounded-xl cursor-pointer transition-all border",
                  !isSameMonth(day, monthStart) ? "text-gray-300 bg-transparent border-transparent" : "text-gray-700 bg-gray-50 hover:bg-gray-100 border-transparent",
                  isSelected && "bg-primary-50 text-primary-700 border-primary-200 font-bold shadow-sm"
                )}
              >
                <span className="text-sm">{format(day, dateFormat)}</span>
                <div className="flex space-x-1 mt-1 h-1.5 min-h-[6px]">
                  {authors.map(author => (
                    <span 
                      key={author} 
                      className={cn("w-1.5 h-1.5 rounded-full", getMemberBgClass(author))}
                    ></span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-bold text-gray-900">
            {format(selectedDate, 'M월 d일', { locale: ko })} 공유된 글
          </h3>
          <div className="flex space-x-2">
            {(['전체', '다연', '유연', '준순'] as const).map(author => (
              <button
                key={author}
                onClick={() => setSelectedAuthor(author)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  selectedAuthor === author 
                    ? "bg-gray-900 text-white border-gray-900" 
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                {author}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentMember={currentMember}
              commentCount={commentCounts[post.id] || 0}
              isBookmarked={bookmarkedPostIds.has(post.id)}
              onBookmark={(e) => onToggleBookmark(e, post.id)}
              onClick={() => onPostClick(post)}
              onEdit={onEdit}
            />
          ))}
          {filteredPosts.length === 0 && (
            <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              해당 날짜에 작성된 글이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
