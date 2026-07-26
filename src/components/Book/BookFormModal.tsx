import React, { useState } from 'react';
import { Book, BookStatus, Member } from '../../types';
import { X } from 'lucide-react';
import { api, isSupabaseConfigured } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { RichTextEditor } from '../RichTextEditor';

interface BookFormModalProps {
  currentMember: Member;
  editBook?: Book;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS: BookStatus[] = ['완독', '읽는 중', '읽고 싶은 책'];

function mergeLearningFields(book?: Book): string {
  return [book?.learning, book?.application].filter(Boolean).join('\n\n');
}

export function BookFormModal({ currentMember, editBook, onClose, onSuccess }: BookFormModalProps) {
  const [title, setTitle] = useState(editBook?.title || '');
  const [author, setAuthor] = useState(editBook?.author || '');
  const [category, setCategory] = useState(editBook?.category || '');
  const [status, setStatus] = useState<BookStatus>(editBook?.status || '완독');
  const [reason, setReason] = useState(editBook?.reason || '');
  const [coreTopic, setCoreTopic] = useState(editBook?.core_topic || '');
  const [content, setContent] = useState(editBook?.content || '');
  const [learning, setLearning] = useState(mergeLearningFields(editBook));
  const [contributionPoint, setContributionPoint] = useState<number>(editBook?.contribution_point || 1);
  const [studyDate, setStudyDate] = useState(editBook?.study_date || new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReadingRecord = status !== '읽고 싶은 책';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured) {
      setError('Supabase 환경 변수가 설정되지 않아 저장할 수 없습니다.');
      return;
    }
    if (!title.trim()) return;
    if (isReadingRecord && !coreTopic.trim()) return;

    setIsSubmitting(true);

    const basePayload = {
      title: title.trim(),
      author: author.trim() || undefined,
      category: category.trim() || undefined,
      status,
    };

    const readingPayload = isReadingRecord
      ? {
          core_topic: coreTopic.trim(),
          content: content.trim() || undefined,
          learning: learning.trim() || undefined,
          contribution_point: contributionPoint,
          study_date: studyDate || undefined,
        }
      : { reason: reason.trim() || undefined };

    try {
      if (editBook) {
        await api.updateBook(editBook.id, { ...basePayload, ...readingPayload });
      } else {
        await api.addBook({ ...basePayload, ...readingPayload, member: currentMember } as Omit<Book, 'id' | 'created_at' | 'updated_at'>);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Error saving book:', err);
      setError(err?.message || '책 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90dvh] flex flex-col shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{editBook ? '책 정보 수정하기' : '새 책 등록하기'}</h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">독서 상태 *</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex-1 px-3 py-2.5 rounded-xl text-sm font-bold border transition-colors whitespace-nowrap",
                    status === s
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">책 제목 *</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors" placeholder="예: 원칙" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">저자 (선택)</label>
              <input value={author} onChange={e => setAuthor(e.target.value)} type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors" placeholder="예: 레이 달리오" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">카테고리 (선택)</label>
              <input value={category} onChange={e => setCategory(e.target.value)} type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors" placeholder="예: 경제/경영" />
            </div>
          </div>

          {!isReadingRecord && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">읽고 싶은 이유 (선택)</label>
              <RichTextEditor
                content={reason}
                onChange={setReason}
                placeholder="이 책을 읽고 싶은 이유를 적어주세요"
                minHeight="100px"
              />
            </div>
          )}

          {isReadingRecord && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">독서 기록 날짜 (선택)</label>
                <input
                  type="date"
                  value={studyDate}
                  onChange={(e) => setStudyDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">핵심 주제 한 줄 *</label>
                <input required value={coreTopic} onChange={e => setCoreTopic(e.target.value)} type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors" placeholder="이 책의 핵심 주제를 한 줄로 요약해주세요" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">책 내용 (선택)</label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="책의 주요 내용을 적어주세요"
                  minHeight="120px"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">느낀 점 / 적용할 점 (선택)</label>
                <RichTextEditor
                  content={learning}
                  onChange={setLearning}
                  placeholder="이 책을 통해 느낀 점과 내 삶에 적용할 점을 적어주세요"
                  minHeight="120px"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">기여도 (Point)</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map(point => (
                    <button
                      key={point}
                      type="button"
                      onClick={() => setContributionPoint(point)}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors",
                        contributionPoint === point
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      +{point}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">기록의 분량/깊이에 따라 기여도를 선택해주세요 (기본값 1점)</p>
              </div>
            </>
          )}

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              취소
            </button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50">
              {isSubmitting ? (editBook ? '수정 중...' : '저장 중...') : (editBook ? '수정 완료' : '등록하기')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
