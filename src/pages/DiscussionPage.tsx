import React, { useMemo } from 'react';
import { Post, Comment, Member } from '../types';
import { PostCard } from '../components/Board/PostCard';
import { MessageSquare, HelpCircle, AlertTriangle } from 'lucide-react';

interface DiscussionPageProps {
  posts: Post[];
  currentMember: Member;
  commentCounts: Record<string, number>;
  bookmarkedPostIds: Set<string>;
  onToggleBookmark: (e: React.MouseEvent, postId: string) => void;
  onPostClick: (post: Post) => void;
  onEdit: (post: Post) => void;
}

export function DiscussionPage({ posts, currentMember, commentCounts, bookmarkedPostIds, onToggleBookmark, onPostClick, onEdit }: DiscussionPageProps) {
  // We don't have global comments loaded in state easily without fetching all,
  // but for the sake of this UI, we can sort posts by commentCount.
  // In a real app we'd fetch specific comments and aggregate. 
  // Here we'll just show "Hot discussions (most comments)"
  
  const hotPosts = useMemo(() => {
    return [...posts].sort((a, b) => (commentCounts[b.id] || 0) - (commentCounts[a.id] || 0)).filter(p => (commentCounts[p.id] || 0) > 0);
  }, [posts, commentCounts]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">토론 라운지</h2>
          <p className="text-sm text-gray-500 mt-1">멤버들의 의견이 가장 활발하게 오가는 기사들입니다.</p>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
          가장 핫한 토론 (댓글 순)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {hotPosts.slice(0, 4).map(post => (
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
          {hotPosts.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
              <p className="text-gray-500">아직 댓글이 달린 기사가 없습니다.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
