import React, { useState, useEffect } from 'react';
import { AppUpdate, Member } from '../types';
import { ADMIN_MEMBER } from '../constants/members';
import { api } from '../lib/supabase';
import { Bell, Plus, Edit2, Trash2, X } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn, getMemberColorClasses, getMemberTextClass } from '../lib/utils';

interface UpdatePageProps {
  currentMember: Member;
}

export function UpdatePage({ currentMember }: UpdatePageProps) {
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<AppUpdate | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentMember === ADMIN_MEMBER;

  const loadUpdates = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUpdates();
      setUpdates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates();
    localStorage.setItem(`last_seen_update_${currentMember}`, new Date().toISOString());
    // Also trigger a custom event so Sidebar can update instantly if needed
    window.dispatchEvent(new Event('updates_seen'));
  }, [currentMember]);

  const openNewForm = () => {
    setEditingUpdate(null);
    setTitle('');
    setContent('');
    setIsFormOpen(true);
  };

  const openEditForm = (u: AppUpdate) => {
    setEditingUpdate(u);
    setTitle(u.title);
    setContent(u.content);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingUpdate) {
        await api.editUpdate(editingUpdate.id, {
          title: title.trim(),
          content: content.trim(),
        });
      } else {
        await api.addUpdate({
          title: title.trim(),
          content: content.trim(),
          author_id: currentMember
        });
      }
      setIsFormOpen(false);
      loadUpdates();
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.deleteUpdate(id);
      loadUpdates();
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">업데이트</h2>
            <p className="text-sm text-gray-500 mt-1">새로운 기능과 변경 사항을 확인하세요.</p>
          </div>
        </div>

        {isAdmin && (
          <button 
            onClick={openNewForm}
            className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            업데이트 작성
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      ) : updates.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">업데이트 내역이 없습니다</h3>
          <p className="text-gray-500">새로운 소식이 곧 추가될 예정입니다.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="divide-y divide-gray-200">
            {updates.map((update, index) => (
              <div 
                key={update.id} 
                className="py-5 first:pt-4 last:pb-0 relative group"
              >
                {isAdmin && (
                  <div className="absolute top-5 right-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditForm(update)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(update.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 mb-1.5">
                  <span className="text-xs font-medium text-gray-400">
                    {new Date(update.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="max-w-2xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight pr-16">
                    {update.title}
                  </h3>
                  
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {update.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/80 z-10 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                {editingUpdate ? '업데이트 수정' : '새 업데이트 작성'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">제목</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                    placeholder="업데이트 제목을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">내용</label>
                  <textarea
                    required
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors resize-none"
                    placeholder="새로운 기능, 버그 수정 내역 등 업데이트 내용을 작성하세요"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
