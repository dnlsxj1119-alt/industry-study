import React from 'react';
import { Post, Member } from '../types';
import { PostCard } from '../components/Board/PostCard';
import { InsightTags } from '../components/Widgets/InsightTags';
import { WeeklyStatus } from '../components/Widgets/WeeklyStatus';
import { Home } from 'lucide-react';

interface HomePageProps {
  posts: Post[];
  currentMember: Member;
  commentCounts: Record<string, number>;
  bookmarkedPostIds: Set<string>;
  onToggleBookmark: (e: React.MouseEvent, postId: string) => void;
  onPostClick: (post: Post) => void;
  onEdit: (post: Post) => void;
}

export function HomePage({ posts, currentMember, commentCounts, bookmarkedPostIds, onToggleBookmark, onPostClick, onEdit }: HomePageProps) {
  const recentPosts = posts.slice(0, 4);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-primary-100 text-primary-700 rounded-xl">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">홈 대시보드</h2>
            <p className="text-sm text-gray-500 mt-1">최근 활동과 주요 인사이트를 한눈에 확인하세요.</p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-4">최근 공유된 기사</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {recentPosts.map(post => (
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
          {recentPosts.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
              <p className="text-gray-500">공유된 기사가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
        <WeeklyStatus posts={posts} currentMember={currentMember} />
        <InsightTags posts={posts} />
      </div>
    </div>
  );
}
