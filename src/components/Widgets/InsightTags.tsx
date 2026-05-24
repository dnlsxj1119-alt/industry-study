import React from 'react';
import { Hash } from 'lucide-react';
import { Post } from '../../types';

interface InsightTagsProps {
  posts: Post[];
}

export function InsightTags({ posts }: InsightTagsProps) {
  // Extract and count tags
  const tagCounts = posts.reduce((acc, post) => {
    post.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Sort by count
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // top 10

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100">
      <div className="flex items-center mb-4">
        <Hash className="w-5 h-5 text-gray-400 mr-2" />
        <h3 className="text-sm font-bold text-gray-900">의견 모아보기</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {sortedTags.length > 0 ? (
          sortedTags.map(([tag, count]) => (
            <button 
              key={tag}
              className="px-3 py-1.5 bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 text-gray-700 hover:text-primary-700 rounded-lg text-xs font-medium transition-colors flex items-center"
            >
              #{tag}
              <span className="ml-1.5 text-[10px] text-gray-400 font-bold">{count}</span>
            </button>
          ))
        ) : (
          <p className="text-xs text-gray-500 w-full text-center py-2">등록된 태그가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
