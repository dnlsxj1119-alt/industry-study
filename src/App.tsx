import React, { useState, useEffect } from 'react';
import { MemberSelect } from './components/MemberSelect';
import { Layout } from './components/Layout';
import { PostModal } from './components/Board/PostModal';
import { PostFormModal } from './components/Board/PostFormModal';
import { Plus } from 'lucide-react';
import { api, isSupabaseConfigured } from './lib/supabase';
import { Post, Category, Member, AppUpdate } from './types';
import { TabId } from './components/Sidebar';
import { NotificationBell } from './components/NotificationBell';

// Pages
import { HomePage } from './pages/HomePage';
import { BoardPage } from './pages/BoardPage';
import { CalendarPage } from './pages/CalendarPage';
import { BookmarkPage } from './pages/BookmarkPage';
import { PresentationPage } from './pages/PresentationPage';
import { DiscussionPage } from './pages/DiscussionPage';
import { MemberPage } from './pages/MemberPage';
import { UpdatePage } from './pages/UpdatePage';

function App() {
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [currentTab, setCurrentTab] = useState<TabId>('홈');
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('전체');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [commentedMembers, setCommentedMembers] = useState<Record<string, string[]>>({});
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<string[]>(['반도체', 'AI', '자동차', '배터리', '전력/에너지', '경제/시장']);
  const [isLoading, setIsLoading] = useState(false);

  // Check localStorage for saved member on initial load
  useEffect(() => {
    const savedMember = localStorage.getItem('study_board_member') as Member;
    if (savedMember && ['다연', '유연', '준순'].includes(savedMember)) {
      setCurrentMember(savedMember);
    }
  }, []);

  const handleMemberSelect = (member: Member) => {
    setCurrentMember(member);
    localStorage.setItem('study_board_member', member);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedPosts = await api.getPosts();
      setPosts(fetchedPosts);
      
      // Load comment counts and commented members
      const counts: Record<string, number> = {};
      const members: Record<string, string[]> = {};
      for (const post of fetchedPosts) {
        const comments = await api.getComments(post.id);
        counts[post.id] = comments.length;
        members[post.id] = Array.from(new Set(comments.map(c => c.author)));
      }
      setCommentCounts(counts);
      setCommentedMembers(members);

      // Load bookmarks for current user
      if (currentMember) {
        const allBookmarks = await api.getBookmarks();
        const userBookmarks = allBookmarks.filter(b => b.author === currentMember);
        setBookmarkedPostIds(new Set(userBookmarks.map(b => b.post_id)));
      }

      // Also fetch categories
      const fetchedCategories = await api.getCategories();
      if (fetchedCategories.length > 0) {
        setCategories(fetchedCategories);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentMember) {
      loadData();
    }
  }, [currentMember]);

  const handleToggleBookmark = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!currentMember) return;
    
    const isNowBookmarked = await api.toggleBookmark(postId, currentMember);
    setBookmarkedPostIds(prev => {
      const newSet = new Set(prev);
      if (isNowBookmarked) {
        newSet.add(postId);
      } else {
        newSet.delete(postId);
      }
      return newSet;
    });
  };

  // Log fallback warning to console instead of showing UI banner
  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn("Supabase 환경 변수가 설정되지 않아 Fallback 데이터를 사용 중입니다.");
    }
  }, []);

  if (!currentMember) {
    return <MemberSelect onSelect={handleMemberSelect} />;
  }

  const renderCurrentPage = () => {
    const commonProps = {
      posts,
      currentMember,
      commentCounts,
      commentedMembers,
      bookmarkedPostIds,
      onToggleBookmark: handleToggleBookmark,
      onPostClick: setSelectedPost,
      onEdit: (post: Post) => {
        setEditingPost(post);
        setIsFormOpen(true);
      }
    };

    switch (currentTab) {
      case '홈':
        return <HomePage {...commonProps} onGoToUpdates={() => setCurrentTab('업데이트')} />;
      case '보드':
        return (
          <BoardPage 
            {...commonProps}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            categories={categories}
          />
        );
      case '달력':
        return <CalendarPage {...commonProps} />;
      case '북마크':
        return <BookmarkPage {...commonProps} />;
      case '발표자료':
        return <PresentationPage currentMember={currentMember} />;
      case '업데이트':
        return <UpdatePage currentMember={currentMember} />;
      case '멤버':
        return <MemberPage {...commonProps} />;
      default:
        return <HomePage {...commonProps} onGoToUpdates={() => setCurrentTab('업데이트')} />;
    }
  };

  const handleNotificationClick = async (postId: string) => {
    let post = posts.find(p => p.id === postId);
    if (!post) {
      const allPosts = await api.getPosts();
      post = allPosts.find(p => p.id === postId);
    }
    if (post) {
      setSelectedPost(post);
    }
  };

  if (!currentMember) {
    return <MemberSelect onSelect={handleMemberSelect} />;
  }

  return (
    <Layout 
      currentMember={currentMember} 
      onChangeMember={() => {
        setCurrentMember(null);
        localStorage.removeItem('study_board_member');
      }}
      currentTab={currentTab}
      onChangeTab={setCurrentTab}
    >
      {/* Header Actions */}
      <div className="flex justify-end items-center space-x-3 mb-6 sticky top-0 z-10 pointer-events-none">
        <NotificationBell currentMember={currentMember} onNotificationClick={handleNotificationClick} />
        {!['발표자료', '업데이트'].includes(currentTab) && (
          <button 
            onClick={() => { setEditingPost(undefined); setIsFormOpen(true); }}
            className="flex items-center px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow active:scale-95 pointer-events-auto"
          >
            <Plus className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">기사 공유하기</span>
          </button>
        )}
      </div>

      {renderCurrentPage()}

      {/* Modals */}
      {selectedPost && (
        <PostModal 
          post={selectedPost} 
          currentMember={currentMember} 
          onClose={() => {
            setSelectedPost(null);
            loadData(); // refresh comment counts
          }} 
          onEdit={(post) => {
            setEditingPost(post);
            setIsFormOpen(true);
          }}
        />
      )}

      {isFormOpen && (
        <PostFormModal 
          currentMember={currentMember} 
          editPost={editingPost}
          categories={categories}
          onAddCategory={async (newCat) => {
            try {
              await api.addCategory(newCat);
            } catch (err: any) {
              // Ignore unique constraint violation (code '23505')
              if (err?.code !== '23505') {
                throw err;
              }
            }
            const updated = await api.getCategories();
            if (updated.length > 0) setCategories(updated);
          }}
          onClose={() => {
            setIsFormOpen(false);
            setEditingPost(undefined);
          }} 
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingPost(undefined);
            loadData();
          }} 
        />
      )}
    </Layout>
  );
}

export default App;
