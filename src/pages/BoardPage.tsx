import React, { useState } from 'react';
import { Post, Category, Member } from '../types';
import { CategoryTabs } from '../components/Board/CategoryTabs';
import { PostCard } from '../components/Board/PostCard';
import { Search, X } from 'lucide-react';

interface BoardPageProps {
  posts: Post[];
  currentMember: Member;
  activeCategory: Category;
  setActiveCategory: (cat: Category) => void;
  commentCounts: Record<string, number>;
  commentedMembers: Record<string, string[]>;
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
  commentedMembers,
  bookmarkedPostIds,
  onToggleBookmark,
  onPostClick,
  onEdit,
  categories
}: BoardPageProps) {
  const [showUncommentedOnly, setShowUncommentedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchContent, setSearchContent] = useState(false);
  const [searchOpinion, setSearchOpinion] = useState(false);
  const allCategories: Category[] = ['전체', ...categories];
  
  let filteredPosts = activeCategory === '전체' 
    ? posts 
    : posts.filter(p => p.category === activeCategory);

  if (showUncommentedOnly) {
    filteredPosts = filteredPosts.filter(p => {
      // 본인이 작성한 기사는 필터(미작성 목록)에서 제외
      if (p.author === currentMember) return false;
      
      const hasCommented = commentedMembers[p.id]?.includes(currentMember);
      return !hasCommented;
    });
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filteredPosts = filteredPosts.filter(p => {
      if (p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q)) return true;
      if (searchContent && p.content?.toLowerCase().includes(q)) return true;
      if (searchOpinion && p.opinion?.toLowerCase().includes(q)) return true;
      return false;
    });
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <CategoryTabs 
          categories={allCategories} 
          activeCategory={activeCategory} 
          onSelect={setActiveCategory} 
        />
        <label className="flex items-center cursor-pointer space-x-2 shrink-0 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={showUncommentedOnly}
              onChange={() => setShowUncommentedOnly(!showUncommentedOnly)}
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${showUncommentedOnly ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showUncommentedOnly ? 'transform translate-x-4' : ''}`}></div>
          </div>
          <span className="text-sm font-medium text-gray-700">내 댓글 미작성 기사만 보기</span>
        </label>
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="기사 제목이나 한줄 요약으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm transition-shadow hover:shadow-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <div className="mt-3 flex items-center space-x-4 px-1">
          <label className="flex items-center space-x-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={searchContent}
              onChange={(e) => setSearchContent(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
              기사 본문 포함
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={searchOpinion}
              onChange={(e) => setSearchOpinion(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
              내 의견 포함
            </span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {filteredPosts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentMember={currentMember}
            commentCount={commentCounts[post.id] || 0}
            hasCommented={commentedMembers[post.id]?.includes(currentMember) || false}
            isBookmarked={bookmarkedPostIds.has(post.id)}
            onBookmark={(e) => onToggleBookmark(e, post.id)}
            onClick={() => onPostClick(post)}
            onEdit={onEdit}
          />
        ))}
        {filteredPosts.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
            <p className="text-gray-500">
              {searchQuery ? "검색 결과가 없습니다" : "이 카테고리에 아직 공유된 기사가 없습니다."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
