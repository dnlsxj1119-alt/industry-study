import React from 'react';
import { Book, Member } from '../../types';
import { Pencil, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getMemberColorClasses, getMemberBorderClass } from '../../lib/utils';
import { HtmlRenderer } from '../HtmlRenderer';

interface BookCardProps {
  book: Book;
  currentMember: Member;
  commentCount?: number;
  onClick: () => void;
  onEdit: (book: Book) => void;
}

const statusColors: Record<string, string> = {
  '읽고 싶은 책': 'bg-slate-100 text-slate-600 border-slate-200',
  '읽는 중': 'bg-blue-100 text-blue-700 border-blue-200',
  '완독': 'bg-green-100 text-green-700 border-green-200',
};

const pointColors: Record<number, string> = {
  1: 'bg-gray-100 text-gray-700 border-gray-200',
  2: 'bg-amber-100 text-amber-800 border-amber-200',
  3: 'bg-rose-100 text-rose-800 border-rose-200',
};

export function BookCard({ book, currentMember, commentCount = 0, onClick, onEdit }: BookCardProps) {
  const timeAgo = formatDistanceToNow(new Date(book.created_at), { addSuffix: true, locale: ko });
  const isReadingRecord = book.status !== '읽고 싶은 책';
  const contributionPoint = book.contribution_point ?? 1;
  const previewText = isReadingRecord ? book.core_topic : book.reason;

  return (
    <div
      onClick={onClick}
      className={cn("bg-white rounded-2xl p-5 cursor-pointer card-shadow border hover:shadow-md flex flex-col h-full relative overflow-hidden transition-all", getMemberBorderClass(book.member))}
    >
      <div className={cn("absolute top-0 left-0 right-0 h-1", getMemberColorClasses(book.member).split(' ')[0])} />
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border", statusColors[book.status])}>
            {book.status}
          </span>
          {book.category && (
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold border bg-purple-50 text-purple-700 border-purple-200">
              {book.category}
            </span>
          )}
          {isReadingRecord && (
            <span className={cn("px-2 py-1 rounded-md text-xs font-bold border", pointColors[contributionPoint] || pointColors[1])} title="기여도">
              +{contributionPoint}
            </span>
          )}
        </div>
        {book.member === currentMember && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(book); }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors shrink-0"
            title="책 정보 수정"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
      {book.author && <p className="text-xs text-gray-500 font-medium mb-3">{book.author}</p>}

      {previewText && (
        <div className="bg-primary-50 rounded-lg p-3 mb-4">
          <div className="text-sm text-primary-900 italic line-clamp-2">
            <HtmlRenderer content={previewText} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 relative z-10">
        <div className="flex items-center space-x-2">
          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border", getMemberColorClasses(book.member))}>
            {book.member[0]}
          </div>
          <span className="text-xs text-gray-700 font-bold">{book.member}</span>
          <span className="text-gray-300 text-xs">•</span>
          <span className="text-xs text-gray-400 font-medium" title={`등록일: ${new Date(book.created_at).toLocaleString()}`}>{timeAgo}</span>
        </div>
        <div className="flex items-center text-gray-500">
          <MessageCircle className="w-4 h-4 mr-1" />
          <span className="text-xs font-medium">{commentCount}</span>
        </div>
      </div>
    </div>
  );
}
