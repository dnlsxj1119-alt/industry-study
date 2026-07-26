import React, { useState } from 'react';
import { Post, Book, Member, Category } from '../types';
import { MEMBERS } from '../constants/members';
import { PostCard } from '../components/Board/PostCard';
import { BookCard } from '../components/Book/BookCard';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn, getMemberBgClass } from '../lib/utils';

interface CalendarPageProps {
  posts: Post[];
  books: Book[];
  currentMember: Member;
  commentCounts: Record<string, number>;
  bookCommentCounts?: Record<string, number>;
  bookmarkedPostIds: Set<string>;
  onToggleBookmark: (e: React.MouseEvent, postId: string) => void;
  onPostClick: (post: Post) => void;
  onEdit: (post: Post) => void;
  onBookClick: (book: Book) => void;
  onEditBook: (book: Book) => void;
}

export function CalendarPage({ posts, books, currentMember, commentCounts, bookCommentCounts = {}, bookmarkedPostIds, onToggleBookmark, onPostClick, onEdit, onBookClick, onEditBook }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAuthor, setSelectedAuthor] = useState<Member | '전체'>('전체');

  // Only 읽는 중 / 완독 books have a study_date and count toward the calendar/contribution stats.
  const loggedBooks = books.filter(b => b.status !== '읽고 싶은 책' && b.study_date);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Filter posts/books for the selected date and author
  const filteredPosts = posts.filter(post => {
    const postDate = new Date(post.study_date);
    const isSame = isSameDay(postDate, selectedDate);
    const authorMatch = selectedAuthor === '전체' || post.author === selectedAuthor;
    return isSame && authorMatch;
  });

  const filteredBooks = loggedBooks.filter(book => {
    const bookDate = new Date(book.study_date as string);
    const isSame = isSameDay(bookDate, selectedDate);
    const authorMatch = selectedAuthor === '전체' || book.member === selectedAuthor;
    return isSame && authorMatch;
  });

  const getDayPosts = (date: Date) => {
    return posts.filter(post => isSameDay(new Date(post.study_date), date));
  };

  const getDayBooks = (date: Date) => {
    return loggedBooks.filter(book => isSameDay(new Date(book.study_date as string), date));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100">&lt;</button>
          <h2 className="text-xl font-bold text-gray-900">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </h2>
          <button onClick={nextMonth} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100">&gt;</button>
        </div>

        <div className="flex items-center justify-end gap-4 mb-2 text-[11px] text-gray-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" /> 기사
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-gray-400 inline-block" /> 책
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-sm font-semibold text-gray-500 py-2">{day}</div>
          ))}
          {days.map((day, idx) => {
            const dayPosts = getDayPosts(day);
            const dayBooks = getDayBooks(day);
            const sortedDayPosts = [...dayPosts].sort((a, b) => a.author.localeCompare(b.author));
            const sortedDayBooks = [...dayBooks].sort((a, b) => a.member.localeCompare(b.member));
            const isSelected = isSameDay(day, selectedDate);
            const dayTotalPoints =
              sortedDayPosts.reduce((sum, p) => sum + (p.contribution_point ?? 1), 0) +
              sortedDayBooks.reduce((sum, b) => sum + (b.contribution_point ?? 1), 0);

            const tooltip = [
              ...sortedDayPosts.map(p => `[기사] ${p.author} (+${p.contribution_point ?? 1}): ${p.title}`),
              ...sortedDayBooks.map(b => `[책] ${b.member} (+${b.contribution_point ?? 1}): ${b.title}`),
            ].join('\n');

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day)}
                title={tooltip}
                className={cn(
                  "p-1 md:p-2 aspect-square flex flex-col justify-center items-center rounded-xl cursor-pointer transition-all border relative",
                  !isSameMonth(day, monthStart) ? "text-gray-300 bg-transparent border-transparent" : "text-gray-700 bg-gray-50 hover:bg-gray-100 border-transparent",
                  isSelected && "bg-primary-50 text-primary-700 border-primary-200 font-bold shadow-sm"
                )}
              >
                {dayTotalPoints > 0 && (
                  <span className="absolute top-0.5 right-0.5 text-[8px] md:text-[9px] font-bold text-primary-700 bg-primary-100 rounded-full px-1 leading-tight">
                    +{dayTotalPoints}
                  </span>
                )}
                <span className="text-sm">{format(day, dateFormat)}</span>
                <div className="flex flex-wrap gap-[3px] mt-1.5 min-h-[6px] items-center justify-center max-w-[80%]">
                  {sortedDayPosts.map(post => (
                    <span
                      key={`post-${post.id}`}
                      title={`[기사] ${post.author} +${post.contribution_point ?? 1}`}
                      className={cn("min-w-[12px] h-[12px] px-[2px] rounded-full text-white text-[7px] font-bold flex items-center justify-center shrink-0 leading-none", getMemberBgClass(post.author))}
                    >
                      +{post.contribution_point ?? 1}
                    </span>
                  ))}
                  {sortedDayBooks.map(book => (
                    <span
                      key={`book-${book.id}`}
                      title={`[책] ${book.member} +${book.contribution_point ?? 1}`}
                      className={cn("min-w-[12px] h-[12px] px-[2px] rounded-sm text-white text-[7px] font-bold flex items-center justify-center shrink-0 leading-none ring-1 ring-white", getMemberBgClass(book.member))}
                    >
                      +{book.contribution_point ?? 1}
                    </span>
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
            {format(selectedDate, 'M월 d일', { locale: ko })} 기록
          </h3>
          <div className="flex space-x-2">
            {(['전체', ...MEMBERS] as const).map(author => (
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
          {filteredBooks.map(book => (
            <BookCard
              key={book.id}
              book={book}
              currentMember={currentMember}
              commentCount={bookCommentCounts[book.id] || 0}
              onClick={() => onBookClick(book)}
              onEdit={onEditBook}
            />
          ))}
          {filteredPosts.length === 0 && filteredBooks.length === 0 && (
            <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              해당 날짜에 작성된 기록이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
