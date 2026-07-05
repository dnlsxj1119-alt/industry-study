import React, { useState } from 'react';
import { Post, Member, Category } from '../types';
import { MEMBERS } from '../constants/members';
import { PostCard } from '../components/Board/PostCard';
import { Users, ChevronRight } from 'lucide-react';
import { WeeklyStatus } from '../components/Widgets/WeeklyStatus';
import { cn, getMemberColorClasses, getMemberBorderClass, getMemberTextClass } from '../lib/utils';

interface MemberPageProps {
  posts: Post[];
  currentMember: Member;
  commentCounts: Record<string, number>;
  bookmarkedPostIds: Set<string>;
  onToggleBookmark: (e: React.MouseEvent, postId: string) => void;
  onPostClick: (post: Post) => void;
  onEdit: (post: Post) => void;
}

export function MemberPage({ posts, currentMember, commentCounts, bookmarkedPostIds, onToggleBookmark, onPostClick, onEdit }: MemberPageProps) {
  const [selectedMember, setSelectedMember] = useState<Member>(MEMBERS[0]);
  const members: Member[] = [...MEMBERS];
  
  const memberPosts = posts.filter(p => p.author === selectedMember);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">멤버 활동</h2>
          <p className="text-sm text-gray-500 mt-1">멤버별로 공유한 기사를 모아봅니다.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 card-shadow space-y-2 mb-6">
            {members.map(member => (
              <button
                key={member}
                onClick={() => setSelectedMember(member)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all border",
                  selectedMember === member 
                    ? getMemberColorClasses(member)
                    : "text-gray-600 hover:bg-gray-50 border-transparent"
                )}
              >
                <div className="flex items-center">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3 border", 
                    selectedMember === member ? "bg-white" : getMemberColorClasses(member)
                  )}>
                    {member[0]}
                  </div>
                  <span className="font-bold">{member}</span>
                </div>
                {selectedMember === member && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </div>
          
          <WeeklyStatus posts={posts} />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedMember}의 글 모아보기</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {memberPosts.map(post => (
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
            {memberPosts.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-gray-100 border-dashed">
                <p className="text-gray-500">작성한 기사가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
