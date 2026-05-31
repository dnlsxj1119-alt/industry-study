import React from 'react';
import { Member, Post } from '../../types';
import { MessageCircle, Bookmark, ExternalLink, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getMemberColorClasses, getMemberBorderClass } from '../../lib/utils';

interface PostCardProps {
  post: Post;
  currentMember: Member;
  commentCount: number;
  isBookmarked: boolean;
  hasCommented?: boolean;
  onBookmark: (e: React.MouseEvent) => void;
  onClick: () => void;
  onEdit: (post: Post) => void;
}

export function PostCard({ post, currentMember, commentCount, isBookmarked, hasCommented, onBookmark, onClick, onEdit }: PostCardProps) {
  const categoryColors: Record<string, string> = {
    '반도체': 'bg-blue-100 text-blue-800 border-blue-200',
    'AI': 'bg-purple-100 text-purple-800 border-purple-200',
    '자동차': 'bg-red-100 text-red-800 border-red-200',
    '배터리': 'bg-green-100 text-green-800 border-green-200',
    '전력/에너지': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    '경제/시장': 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const studyDateStr = post.study_date ? new Date(post.study_date).toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric'
  }) : '날짜 미지정';

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko });

  return (
    <div 
      onClick={onClick}
      className={cn("bg-white rounded-2xl p-5 cursor-pointer card-shadow border hover:shadow-md flex flex-col h-full relative overflow-hidden transition-all", getMemberBorderClass(post.author))}
    >
      {/* Top Accent Line */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", getMemberColorClasses(post.author).split(' ')[0])} />
      <div className="flex justify-between items-start mb-3">
        <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border", categoryColors[post.category] || categoryColors['경제/시장'])}>
          {post.category}
        </span>
        <div className="flex items-center space-x-2">
          {post.author === currentMember && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(post); }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              title="게시글 수정"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onBookmark(e); }}
            className={cn("p-1.5 rounded-full hover:bg-gray-100 transition-colors", isBookmarked ? "text-primary-600" : "text-gray-400")}
          >
            <Bookmark className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="mb-2">
        {hasCommented !== undefined && (
          hasCommented ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              ✅ 내 댓글 완료
            </span>
          ) : post.author !== currentMember ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-100">
              ⚠️ 댓글 미작성
            </span>
          ) : null
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
        <span className="font-semibold text-gray-800">요약:</span> {post.summary}
      </p>

      <div className="bg-primary-50 rounded-lg p-3 mb-4">
        <p className="text-sm text-primary-900 italic line-clamp-2">
          "{post.opinion}"
        </p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 relative z-10">
        <div className="flex items-center space-x-2">
          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border", getMemberColorClasses(post.author))}>
            {post.author[0]}
          </div>
          <span className="text-xs text-gray-700 font-bold">{post.author}</span>
          <span className="text-gray-300 text-xs">•</span>
          <span className="text-xs text-gray-500 font-bold">{studyDateStr} 스터디</span>
          <span className="text-gray-300 text-xs">•</span>
          <span className="text-xs text-gray-400 font-medium" title={`작성일: ${new Date(post.created_at).toLocaleString()}`}>{timeAgo}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-gray-500">
            <MessageCircle className="w-4 h-4 mr-1" />
            <span className="text-xs font-medium">{commentCount}</span>
          </div>
          {post.url && (
            <a 
              href={post.url} 
              target="_blank" 
              rel="noreferrer" 
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-primary-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
