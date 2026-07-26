import React, { useState, useEffect } from 'react';
import { Book, Comment, CommentType, Member } from '../../types';
import { X, Pencil, Trash2, MessageCircle } from 'lucide-react';
import { cn, getMemberColorClasses, getMemberTextClass } from '../../lib/utils';
import { api } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { HtmlRenderer } from '../HtmlRenderer';
import { TextWithLinks } from '../TextWithLinks';

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

const typeColors: Record<CommentType, string> = {
  '동의': 'bg-blue-50 text-blue-700 border-blue-200',
  '반론': 'bg-red-50 text-red-700 border-red-200',
  '추가자료': 'bg-green-50 text-green-700 border-green-200',
  '질문': 'bg-purple-50 text-purple-700 border-purple-200',
};

export function BookModal({ book, currentMember, onClose, onEdit }: BookModalProps) {
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('동의');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  const isReadingRecord = book.status !== '읽고 싶은 책';
  const contributionPoint = book.contribution_point ?? 1;

  useEffect(() => {
    loadComments();
  }, [book.id]);

  const loadComments = async () => {
    const data = await api.getBookComments(book.id);
    setComments(data);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await api.addBookComment({
        book_id: book.id,
        author: currentMember,
        type: commentType,
        content: newComment.trim()
      });

      const recipients = new Set<string>();
      recipients.add(book.member);
      comments.forEach(c => recipients.add(c.author));
      recipients.delete(currentMember);

      const notifyPromises = Array.from(recipients).map(recipient =>
        api.addNotification({
          recipient_id: recipient,
          actor_id: currentMember,
          type: 'comment',
          book_id: book.id,
          comment_id: 'new',
          message: book.member === recipient
            ? `${currentMember}님이 내 책 기록에 댓글을 남겼습니다.`
            : `${currentMember}님이 책 기록에 댓글을 남겼습니다.`
        })
      );
      await Promise.all(notifyPromises);

      setNewComment('');
      loadComments();
    } catch (err: any) {
      setError(err.message || '댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return;

    setError(null);
    try {
      await api.deleteComment(commentId);
      loadComments();
    } catch (err: any) {
      setError(err.message || '댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;

    setError(null);
    try {
      await api.updateComment(commentId, editCommentText.trim());
      setEditingCommentId(null);
      loadComments();
    } catch (err: any) {
      setError(err.message || '댓글 수정 중 오류가 발생했습니다.');
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
              {book.category && (
                <span className="px-2 py-1 rounded-md text-xs font-semibold border bg-purple-50 text-purple-700 border-purple-200">
                  {book.category}
                </span>
              )}
              {isReadingRecord && (
                <span className={cn("px-2 py-1 rounded-md text-xs font-bold border", pointColors[contributionPoint] || pointColors[1])} title="기여도">
                  +{contributionPoint}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{book.title}</h2>
            {book.author && <p className="text-sm text-gray-500 font-medium mb-2">{book.author}</p>}
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

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="flex items-center mb-2">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm mr-3 border bg-white", getMemberTextClass(book.member))}>
              {book.member[0]}
            </div>
            <span className="text-sm font-bold text-gray-900">{book.member}</span>
          </div>

          {!isReadingRecord && book.reason && (
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mt-6">
              <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">읽고 싶은 이유</h4>
              <HtmlRenderer content={book.reason} className="text-gray-800" />
            </div>
          )}

          {isReadingRecord && (
            <>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mt-6">
                <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">핵심 주제</h4>
                <p className="text-gray-800 font-medium text-lg leading-relaxed">{book.core_topic}</p>
              </div>

              {book.content && (
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mt-6">
                  <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">책 내용</h4>
                  <HtmlRenderer content={book.content} className="text-gray-800" />
                </div>
              )}

              {(book.learning || book.application) && (
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mt-6">
                  <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">느낀 점 / 적용할 점</h4>
                  {book.learning && <HtmlRenderer content={book.learning} className="text-gray-800" />}
                  {book.application && <HtmlRenderer content={book.application} className="text-gray-800 mt-3" />}
                </div>
              )}
            </>
          )}

          {/* Comments Section */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-gray-500" />
              의견 및 토론 <span className="ml-2 text-sm bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{comments.length}</span>
            </h3>

            <div className="space-y-4 mb-6">
              {comments.map(comment => (
                <div key={comment.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border", getMemberColorClasses(comment.author))}>
                        {comment.author[0]}
                      </div>
                      <span className={cn("font-semibold text-sm", getMemberTextClass(comment.author))}>{comment.author}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                        {comment.updated_at && comment.updated_at !== comment.created_at && " (수정됨)"}
                      </span>
                    </div>

                    {comment.author === currentMember && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditCommentText(comment.content);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="댓글 수정"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="댓글 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (editCommentText.trim()) {
                              handleUpdateComment(comment.id);
                            }
                          }
                        }}
                        className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 resize-none p-2"
                        rows={2}
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="text-xs px-3 py-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleUpdateComment(comment.id)}
                          className="text-xs px-3 py-1.5 text-white bg-gray-900 hover:bg-gray-800 rounded-md font-medium"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className={cn("self-start px-2 py-0.5 rounded text-[10px] font-bold border mb-1", typeColors[comment.type])}>
                        {comment.type}
                      </span>
                      <TextWithLinks text={comment.content} className="text-gray-700 text-sm" />
                    </div>
                  )}
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm bg-white rounded-xl border border-gray-100 border-dashed">
                  첫 번째 의견을 남겨보세요!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comment Form */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmitComment} className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
            <div className="flex space-x-2">
              {(['동의', '반론', '추가자료', '질문'] as CommentType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCommentType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    commentType === type
                      ? typeColors[type]
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex space-x-2">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (newComment.trim()) {
                      handleSubmitComment(e as unknown as React.FormEvent);
                    }
                  }
                }}
                placeholder={`${currentMember}(으)로 의견 남기기... (Enter로 등록, Shift+Enter로 줄바꿈)`}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors text-sm resize-none"
                rows={2}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                등록
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
