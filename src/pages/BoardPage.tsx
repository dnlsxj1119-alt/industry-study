import React from 'react';
import { Post, Category, Member } from '../types';
import { CategoryTabs } from '../components/Board/CategoryTabs';
import { PostCard } from '../components/Board/PostCard';

interface BoardPageProps {
  posts: Post[];
  currentMember: Member;
  activeCategory: Category;
  setActiveCategory: (cat: Category) => void;
  commentCounts: Record<string, number>;
  bookmarkedPostIds: Set<string>;
  onToggleBookmark: (e: React.MouseEvent, postId: string) => void;
  onPostClick: (post: Post) => void;
  onEdit: (post: Post) => void;
  categories: string[];
}

export function BoardPage({
  posts,
  currentMember,
  activeCategory,
  setActiveCategory,
  commentCounts,
  bookmarkedPostIds,
  onToggleBookmark,
  onPostClick,
  onEdit,
  categories
}: BoardPageProps) {
  const allCategories: Category[] = ['전체', ...categories];
  
  const filteredPosts = activeCategory === '전체' 
    ? posts 
    : posts.filter(p => p.category === activeCategory);

  return (
    <div className="flex-1 min-w-0">
      <div className="mb-6">
        <CategoryTabs 
          categories={allCategories} 
          activeCategory={activeCategory} 
          onSelect={setActiveCategory} 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
        {filteredPosts.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
            <p className="text-gray-500">이 카테고리에 아직 공유된 기사가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
