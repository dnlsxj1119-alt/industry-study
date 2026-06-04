import React, { useState, useEffect } from 'react';
import { Presentation, Member, Attachment } from '../types';
import { Mic, Search, Plus, X, Pencil, Trash2, Calendar as CalendarIcon, Paperclip, Download, Image as ImageIcon, FileText } from 'lucide-react';
import { api } from '../lib/supabase';
import { cn, getMemberColorClasses, getMemberTextClass } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PresentationPageProps {
  currentMember: Member;
}

export function PresentationPage({ currentMember }: PresentationPageProps) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [studyDate, setStudyDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    const data = await api.getPresentations();
    setPresentations(data);
  };

  const openNewModal = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setStudyDate('');
    setTagsInput('');
    setAttachments([]);
    setFilesToUpload([]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Presentation) => {
    setEditingId(p.id);
    setTitle(p.title);
    setContent(p.content);
    setStudyDate(p.study_date || '');
    setTagsInput(p.tags.join(', '));
    setAttachments(p.attachments || []);
    setFilesToUpload([]);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 발표자료를 정말 삭제하시겠습니까?')) return;
    try {
      await api.deletePresentation(id);
      loadPresentations();
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    try {
      let finalAttachments = [...attachments];
      if (filesToUpload.length > 0) {
        const uploaded = await Promise.all(
          filesToUpload.map(async file => {
            const url = await api.uploadPresentationFile(file);
            return {
              name: file.name,
              url,
              size: file.size,
              type: file.type
            };
          })
        );
        finalAttachments = [...finalAttachments, ...uploaded];
      }

      if (editingId) {
        await api.updatePresentation(editingId, {
          title: title.trim(),
          content: content.trim(),
          study_date: studyDate || undefined,
          tags,
          attachments: finalAttachments
        });
      } else {
        await api.addPresentation({
          author: currentMember,
          title: title.trim(),
          content: content.trim(),
          study_date: studyDate || undefined,
          tags,
          attachments: finalAttachments
        });
      }
      setIsModalOpen(false);
      loadPresentations();
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = presentations.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.author.includes(searchQuery)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">발표자료</h2>
            <p className="text-sm text-gray-500 mt-1">스터디 발표 주제와 내용을 등록하고 관리하세요.</p>
          </div>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>등록하기</span>
        </button>
      </div>

      <div className="relative mb-2">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="제목, 내용, 작성자 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm transition-shadow hover:shadow-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col group p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border", getMemberColorClasses(p.author))}>
                  {p.author[0]}
                </div>
                <span className={cn("font-semibold text-sm", getMemberTextClass(p.author))}>{p.author}</span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: ko })}
                </span>
              </div>
              {p.author === currentMember && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(p)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{p.title}</h3>
            
            <div className="text-gray-700 text-sm whitespace-pre-wrap flex-1 mb-4">
              {p.content}
            </div>

            {p.attachments && p.attachments.length > 0 && (
              <div className="mt-2 mb-4 space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {p.attachments.map((att, idx) => {
                    const isImage = att.type.startsWith('image/');
                    return (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group bg-white"
                      >
                        {isImage ? (
                          <ImageIcon className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-gray-500 mr-2 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate group-hover:text-primary-600">{att.name}</p>
                          <p className="text-[10px] text-gray-500">{(att.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Download className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-1">
                {p.tags?.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                {p.attachments && p.attachments.length > 0 && (
                  <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                    <Paperclip className="w-3 h-3 mr-1" />
                    {p.attachments.length}
                  </div>
                )}
                {p.study_date && (
                  <div className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {new Date(p.study_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
            <p className="text-gray-500">등록된 발표자료가 없습니다.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? '발표자료 수정' : '새 발표자료 등록'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">발표 주제</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="예: AI 반도체 경쟁의 변화"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">발표 예정일 (선택)</label>
                <input
                  type="date"
                  value={studyDate}
                  onChange={e => setStudyDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">발표 내용</label>
                <textarea
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                  rows={6}
                  placeholder="- GPU 성능 경쟁에서 전력 안정성 경쟁으로 확대&#10;- Silicon Capacitor 역할"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">태그 (선택)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="쉼표(,)로 구분하여 입력 (예: AI, 반도체, ESS)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">첨부파일</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="space-y-1 text-center">
                    <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                        <span>파일 선택</span>
                        <input type="file" multiple className="sr-only" onChange={e => {
                          if (e.target.files) {
                            setFilesToUpload(prev => [...prev, ...Array.from(e.target.files!)]);
                          }
                        }} />
                      </label>
                      <p className="pl-1">또는 드래그 앤 드롭</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, PPT, PNG, JPG, DOC 등</p>
                  </div>
                </div>
                
                {(attachments.length > 0 || filesToUpload.length > 0) && (
                  <ul className="mt-4 border border-gray-200 rounded-xl divide-y divide-gray-200 bg-gray-50">
                    {attachments.map((att, idx) => (
                      <li key={`att-${idx}`} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        <div className="w-0 flex-1 flex items-center">
                          <Paperclip className="flex-shrink-0 h-5 w-5 text-gray-400" />
                          <span className="ml-2 flex-1 w-0 truncate">{att.name}</span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="font-medium text-red-600 hover:text-red-500"
                          >
                            삭제
                          </button>
                        </div>
                      </li>
                    ))}
                    {filesToUpload.map((file, idx) => (
                      <li key={`file-${idx}`} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        <div className="w-0 flex-1 flex items-center">
                          <FileText className="flex-shrink-0 h-5 w-5 text-gray-400" />
                          <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                          <span className="ml-2 text-gray-500 text-xs px-2 py-0.5 bg-gray-200 rounded-full">업로드 예정</span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setFilesToUpload(prev => prev.filter((_, i) => i !== idx))}
                            className="font-medium text-red-600 hover:text-red-500"
                          >
                            삭제
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors shadow-sm"
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
