import React from 'react';
import { Post } from '../types';
import { PostCard } from '../components/Board/PostCard';
import { Bookmark as BookmarkIcon } from 'lucide-react';

interface BookmarkPageProps {
  posts: Post[];
  commentCounts: Record<string, number>;
  bookmarkedPostIds: Set<string>;
  onToggleBookmark: (e: React.MouseEvent, postId: string) => void;
  onPostClick: (post: Post) => void;
}

export function BookmarkPage({ posts, commentCounts, bookmarkedPostIds, onToggleBookmark, onPostClick }: BookmarkPageProps) {
  const bookmarkedPosts = posts.filter(post => bookmarkedPostIds.has(post.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-3 bg-primary-100 text-primary-700 rounded-xl">
          <BookmarkIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">내 북마크</h2>
          <p className="text-sm text-gray-500 mt-1">내가 스크랩한 중요한 기사들입니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {bookmarkedPosts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            commentCount={commentCounts[post.id] || 0}
            isBookmarked={true}
            onBookmark={(e) => onToggleBookmark(e, post.id)}
            onClick={() => onPostClick(post)}
          />
        ))}
        {bookmarkedPosts.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
            <p className="text-gray-500">아직 북마크한 기사가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
