import React, { useState, useEffect } from 'react';
import { Post, Comment, CommentType, Member } from '../../types';
import { X, MessageCircle, ExternalLink, Bookmark, Pencil, Trash2 } from 'lucide-react';
import { cn, getMemberColorClasses, getMemberTextClass } from '../../lib/utils';
import { api } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PostModalProps {
  post: Post;
  currentMember: Member;
  onClose: () => void;
  onEdit: (post: Post) => void;
}

export function PostModal({ post, currentMember, onClose, onEdit }: PostModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('동의');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    const data = await api.getComments(post.id);
    setComments(data);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await api.addComment({
        post_id: post.id,
        author: currentMember,
        type: commentType,
        content: newComment.trim()
      });
      setNewComment('');
      loadComments();
    } catch (err: any) {
      setError(err.message || '댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까? 연결된 댓글과 북마크도 모두 삭제됩니다.')) return;
    
    setError(null);
    try {
      await api.deletePost(post.id);
      onClose(); // App.tsx will refresh the posts since we call loadData on onClose
    } catch (err: any) {
      setError(err.message || '게시글 삭제 중 오류가 발생했습니다.');
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

  const typeColors: Record<CommentType, string> = {
    '동의': 'bg-blue-50 text-blue-700 border-blue-200',
    '반론': 'bg-red-50 text-red-700 border-red-200',
    '추가자료': 'bg-green-50 text-green-700 border-green-200',
    '질문': 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const createdDate = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).replace(/. /g, '.').replace(/\.$/, '');
  const createdTime = new Date(post.created_at).toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit'
  });
  const isEdited = post.updated_at && post.updated_at !== post.created_at;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">
        
        {error && (
          <div className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 px-4 py-2 text-sm text-center font-medium rounded-t-2xl">
            {error}
          </div>
        )}

        {/* Header (Sticky) */}
        <div className={cn("flex-none border-b border-gray-100 p-6 bg-white rounded-t-2xl relative", error && "mt-8")}>
          <div className="pr-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                {post.category}
              </span>
              <span className="text-gray-400 text-sm">출처: {post.source}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{post.title}</h2>
            <div className="flex items-center space-x-3 text-sm text-gray-500 font-medium">
              <span>{createdDate} {createdTime}</span>
              {isEdited && <span className="text-gray-400 text-xs bg-gray-100 px-1.5 py-0.5 rounded">수정됨</span>}
              {post.url && (
                <>
                  <span className="text-gray-300">•</span>
                  <a href={post.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary-600 hover:text-primary-700">
                    원문 보기 <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </>
              )}
            </div>
          </div>
          
          <div className="absolute top-4 right-4 flex items-center space-x-1">
            {post.author === currentMember && (
              <>
                <button onClick={() => { onClose(); onEdit(post); }} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors" title="수정">
                  <Pencil className="w-5 h-5" />
                </button>
                <button onClick={handleDeletePost} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-full transition-colors" title="삭제">
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors" title="닫기">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {post.content && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
              <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mr-2"></span>
                기사 내용
              </h4>
              <div className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>
            </div>
          )}

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mb-6">
            <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">한줄 요약</h4>
            <p className="text-gray-800 font-medium text-lg leading-relaxed">{post.summary}</p>
          </div>

          <div className={cn("p-5 rounded-xl border shadow-sm mb-8", getMemberColorClasses(post.author).replace('text-', 'text-gray-').replace('border-', 'border-').replace('bg-', 'bg-').split(' ')[0], "bg-opacity-30")}>
            <div className="flex items-center mb-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm mr-3 border bg-white", getMemberTextClass(post.author))}>
                {post.author[0]}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{post.author}의 의견</h4>
                <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko })}</p>
              </div>
            </div>
            <p className="text-gray-800 font-medium leading-relaxed">
              "{post.opinion}"
            </p>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white/60 text-primary-700 rounded-md text-xs font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div>
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
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
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
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder={`${currentMember}(으)로 의견 남기기...`}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors text-sm"
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
