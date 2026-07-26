import React, { useState } from 'react';
import { Book, Member } from '../../types';
import { X, Pencil, Trash2 } from 'lucide-react';
import { cn, getMemberTextClass } from '../../lib/utils';
import { api } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface BookModalProps {
  book: Book;
  currentMember: Member;
  onClose: () => void;
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

export function BookModal({ book, currentMember, onClose, onEdit }: BookModalProps) {
  const [error, setError] = useState<string | null>(null);

  const isReadingRecord = book.status !== '읽고 싶은 책';
  const contributionPoint = book.contribution_point ?? 1;

  const handleDeleteBook = async () => {
    if (!window.confirm('정말 이 책을 삭제하시겠습니까?')) return;

    setError(null);
    try {
      await api.deleteBook(book.id);
      onClose();
    } catch (err: any) {
      setError(err.message || '책 삭제 중 오류가 발생했습니다.');
    }
  };

  const studyDateStr = book.study_date ? new Date(book.study_date).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">

        {error && (
          <div className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 px-4 py-2 text-sm text-center font-medium rounded-t-2xl">
            {error}
          </div>
        )}

        <div className={cn("flex-none border-b border-gray-100 p-6 bg-white rounded-t-2xl relative", error && "mt-8")}>
          <div className="pr-8">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className={cn("px-2 py-1 rounded-md text-xs font-semibold border", statusColors[book.status])}>
                {book.status}
              </span>
              <span className="px-2 py-1 rounded-md text-xs font-semibold border bg-purple-50 text-purple-700 border-purple-200">
                {book.category}
              </span>
              {isReadingRecord && (
                <span className={cn("px-2 py-1 rounded-md text-xs font-bold border", pointColors[contributionPoint] || pointColors[1])} title="기여도">
                  +{contributionPoint}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{book.title}</h2>
            <p className="text-sm text-gray-500 font-medium mb-2">{book.author}</p>
            <div className="flex items-center space-x-3 text-sm font-medium">
              {studyDateStr && <span className="text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{studyDateStr} 기록</span>}
              <span className="text-gray-400 text-xs" title="등록일시">{formatDistanceToNow(new Date(book.created_at), { addSuffix: true, locale: ko })}</span>
            </div>
          </div>

          <div className="absolute top-4 right-4 flex items-center space-x-1">
            {book.member === currentMember && (
              <>
                <button onClick={() => { onClose(); onEdit(book); }} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors" title="수정">
                  <Pencil className="w-5 h-5" />
                </button>
                <button onClick={handleDeleteBook} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-full transition-colors" title="삭제">
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors" title="닫기">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">
          <div className="flex items-center mb-2">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm mr-3 border bg-white", getMemberTextClass(book.member))}>
              {book.member[0]}
            </div>
            <span className="text-sm font-bold text-gray-900">{book.member}</span>
          </div>

          {!isReadingRecord && (
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">읽고 싶은 이유</h4>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{book.reason}</p>
            </div>
          )}

          {isReadingRecord && (
            <>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">핵심 주제</h4>
                <p className="text-gray-800 font-medium text-lg leading-relaxed">{book.core_topic}</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">배운 점</h4>
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{book.learning}</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">내 삶에 적용할 점</h4>
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{book.application}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
