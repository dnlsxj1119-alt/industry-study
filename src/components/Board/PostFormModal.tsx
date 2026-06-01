import React, { useState } from 'react';
import { Post, Category, Member } from '../../types';
import { X } from 'lucide-react';
import { api } from '../../lib/supabase';

interface PostFormModalProps {
  currentMember: Member;
  editPost?: Post;
  categories: string[];
  onAddCategory: (name: string) => Promise<void>;
  onClose: () => void;
  onSuccess: () => void;
}

export function PostFormModal({ currentMember, editPost, categories, onAddCategory, onClose, onSuccess }: PostFormModalProps) {
  const [title, setTitle] = useState(editPost?.title || '');
  const [url, setUrl] = useState(editPost?.url || '');
  const [source, setSource] = useState(editPost?.source || '');
  const [summary, setSummary] = useState(editPost?.summary || '');
  const [opinion, setOpinion] = useState(editPost?.opinion || '');
  const [content, setContent] = useState(editPost?.content || '');
  const [category, setCategory] = useState<string>(editPost?.category || '반도체');
  const [tagsInput, setTagsInput] = useState(editPost?.tags.join(', ') || '');
  const [studyDate, setStudyDate] = useState(editPost?.study_date || new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Filter out "전체" for the form dropdown
  const selectableCategories = categories.filter(c => c !== '전체');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !opinion) return;

    setIsSubmitting(true);
    
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    if (editPost) {
      await api.updatePost(editPost.id, {
        title,
        url: url || undefined,
        source,
        summary,
        opinion,
        content: content || undefined,
        category,
        tags,
        study_date: studyDate,
      });
    } else {
      await api.addPost({
        title,
        url: url || undefined,
        source,
        summary,
        opinion,
        content: content || undefined,
        category,
        tags,
        study_date: studyDate,
        author: currentMember,
      });
    }

    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90dvh] flex flex-col shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{editPost ? '기사 수정하기' : '새 기사 공유하기'}</h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">기사 제목 *</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors" placeholder="예: TSMC CoWoS 증설 속도 둔화" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">스터디 카테고리 *</label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap ml-2"
                >
                  {isAddingCategory ? '취소' : '+ 카테고리 추가'}
                </button>
              </div>
              
              {isAddingCategory ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="새 카테고리명"
                    className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const catName = newCategory.trim();
                      if (!catName) return;
                      
                      try {
                        // Prevent duplicate API calls if already in list
                        if (!categories.includes(catName)) {
                          await onAddCategory(catName);
                        }
                        setCategory(catName);
                        setNewCategory('');
                        setIsAddingCategory(false);
                      } catch (err) {
                        alert('카테고리 추가에 실패했습니다. (DB 테이블/RLS 설정을 확인해주세요)');
                        console.error('Failed to add category:', err);
                      }
                    }}
                    className="px-4 py-2.5 shrink-0 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    추가
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all appearance-none bg-white"
                >
                  {selectableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">스터디 날짜 *</label>
              <input
                type="date"
                required
                value={studyDate}
                onChange={(e) => setStudyDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">URL (선택)</label>
              <input value={url} onChange={e => setUrl(e.target.value)} type="url" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors" placeholder="https://" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">출처 (언론사 등)</label>
              <input value={source} onChange={e => setSource(e.target.value)} type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors" placeholder="예: Bloomberg" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">한줄 요약 *</label>
            <input required value={summary} onChange={e => setSummary(e.target.value)} type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors" placeholder="기사의 핵심 내용을 한 줄로 요약해주세요" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">내 의견 *</label>
            <textarea required value={opinion} onChange={e => setOpinion(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors resize-none" placeholder="이 기사를 공유하는 이유나 내 생각을 적어주세요" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">기사 내용 (선택)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors resize-none" placeholder="기사 본문의 주요 내용을 복사해서 붙여넣을 수 있습니다 (상세 모달에서만 보임)" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">태그 (쉼표로 구분)</label>
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors" placeholder="예: HBM, 패키징, TSMC" />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              취소
            </button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50">
              {isSubmitting ? (editPost ? '수정 중...' : '저장 중...') : (editPost ? '수정 완료' : '공유하기')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
