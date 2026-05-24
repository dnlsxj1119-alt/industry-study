import React, { useState } from 'react';
import { Category, Member } from '../../types';
import { X } from 'lucide-react';
import { api } from '../../lib/supabase';

interface PostFormModalProps {
  currentMember: Member;
  onClose: () => void;
  onSuccess: () => void;
}

export function PostFormModal({ currentMember, onClose, onSuccess }: PostFormModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [summary, setSummary] = useState('');
  const [opinion, setOpinion] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Exclude<Category, '전체'>>('반도체');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: Exclude<Category, '전체'>[] = ['반도체', 'AI', '자동차', '배터리', '전력/에너지', '경제/시장'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !opinion) return;

    setIsSubmitting(true);
    
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    await api.addPost({
      title,
      url: url || undefined,
      source,
      summary,
      opinion,
      content: content || undefined,
      category,
      tags,
      author: currentMember,
    });

    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-2xl relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">새 기사 공유하기</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">기사 제목 *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors" placeholder="예: TSMC CoWoS 증설 속도 둔화" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">카테고리 *</label>
              <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors appearance-none">
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
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
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
              취소
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center">
              {isSubmitting ? '업로드 중...' : `${currentMember}(으)로 공유하기`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
