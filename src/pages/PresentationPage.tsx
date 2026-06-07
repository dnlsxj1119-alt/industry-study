import React, { useState, useEffect } from 'react';
import { Presentation, Member, Attachment } from '../types';
import { Mic, Search, Plus, X, Pencil, Trash2, Calendar as CalendarIcon, Paperclip, Download, Image as ImageIcon, FileText } from 'lucide-react';
import { api } from '../lib/supabase';
import { cn, getMemberColorClasses, getMemberTextClass } from '../lib/utils';
import { formatDistanceToNow, startOfMonth, differenceInCalendarWeeks, format as formatDate } from 'date-fns';
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
  const [isDragging, setIsDragging] = useState(false);
  
  // Viewing state
  const [viewingPost, setViewingPost] = useState<Presentation | null>(null);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFilesToUpload(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const filtered = presentations.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.author.includes(searchQuery)
  );

  const getWeekString = (dateStr: string | undefined, createdStr: string) => {
    const date = new Date(dateStr || createdStr);
    const monthStart = startOfMonth(date);
    const weekNumber = differenceInCalendarWeeks(date, monthStart, { weekStartsOn: 1 }) + 1;
    return `${formatDate(date, 'yyyy년 M월')} ${weekNumber}주차|${formatDate(date, 'yyyy.MM.dd')}`;
  };

  const groupedPresentations = filtered.reduce((acc, p) => {
    const weekStr = getWeekString(p.study_date, p.created_at);
    if (!acc[weekStr]) acc[weekStr] = [];
    acc[weekStr].push(p);
    return acc;
  }, {} as Record<string, Presentation[]>);

  const sortedWeeks = Object.keys(groupedPresentations).sort((a, b) => {
    const dateA = new Date(groupedPresentations[a][0].study_date || groupedPresentations[a][0].created_at).getTime();
    const dateB = new Date(groupedPresentations[b][0].study_date || groupedPresentations[b][0].created_at).getTime();
    return dateB - dateA;
  });

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

      <div className="space-y-10">
        {sortedWeeks.map(weekKey => {
          const [weekStr, dateStr] = weekKey.split('|');
          return (
          <div key={weekKey} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-baseline space-x-2 mb-4 pl-1">
              <span className="text-xl">📅</span>
              <h3 className="text-lg font-bold text-gray-900">
                {weekStr}
                {dateStr && <span className="ml-2 text-sm font-medium text-gray-400">({dateStr})</span>}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupedPresentations[weekKey].map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setViewingPost(p)}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-primary-200 transition-all flex flex-col group p-5 cursor-pointer relative"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight pr-12 group-hover:text-primary-700 transition-colors">
                    {p.title}
                    {p.updated_at && p.updated_at !== p.created_at && (
                      <span className="ml-2 text-[11px] font-normal text-gray-400 align-middle">(수정됨)</span>
                    )}
                  </h3>
                  
                  <div className="text-gray-600 text-[13px] line-clamp-2 mb-4 leading-relaxed break-keep whitespace-pre-wrap">
                    {p.content}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-auto mb-3">
                    {p.tags?.slice(0, 5).map(tag => (
                      <span key={tag} className="text-gray-400 text-[11px] tracking-tight">
                        #{tag}
                      </span>
                    ))}
                    {p.tags && p.tags.length > 5 && (
                      <span className="text-gray-300 text-[11px] tracking-tight">
                        +{p.tags.length - 5}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border", getMemberColorClasses(p.author))}>
                        {p.author[0]}
                      </div>
                      <span className={cn("font-medium text-xs", getMemberTextClass(p.author))}>{p.author}</span>
                      <span className="text-[10px] text-gray-400">
                        · {new Date(p.study_date || p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {p.attachments && p.attachments.length > 0 && (
                      <div className="flex items-center text-xs font-medium text-gray-500">
                        <Paperclip className="w-3.5 h-3.5 mr-1" />
                        {p.attachments.length}
                      </div>
                    )}
                  </div>
                  
                  {(p.author === currentMember || currentMember === '다연') && (
                    <div className="absolute top-4 right-4 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-gray-100">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(p); }} 
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                        title="수정"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} 
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          );
        })}
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
                <div 
                  className={cn(
                    "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors",
                    isDragging ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:bg-gray-50"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <Paperclip className={cn("mx-auto h-12 w-12", isDragging ? "text-primary-500" : "text-gray-400")} />
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

      {/* View Modal */}
      {viewingPost && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white z-10 shrink-0">
              <div className="flex items-center space-x-2 text-gray-500 text-sm font-medium">
                <Mic className="w-4 h-4" />
                <span>발표자료 상세</span>
              </div>
              <div className="flex items-center space-x-1">
                {(viewingPost.author === currentMember || currentMember === '다연') && (
                  <>
                    <button 
                      onClick={() => { setViewingPost(null); openEditModal(viewingPost); }} 
                      className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors flex items-center"
                      title="수정"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => { handleDelete(viewingPost.id); setViewingPost(null); }} 
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-1"></div>
                  </>
                )}
                <button onClick={() => setViewingPost(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto">
              <div className="mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 leading-tight">
                  {viewingPost.title}
                  {viewingPost.updated_at && viewingPost.updated_at !== viewingPost.created_at && (
                    <span className="ml-3 text-sm font-normal text-gray-400 align-middle tracking-normal">(수정됨)</span>
                  )}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {viewingPost.tags?.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-gray-50 border border-gray-100 text-gray-600 rounded-md text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border bg-white", getMemberColorClasses(viewingPost.author))}>
                      {viewingPost.author[0]}
                    </div>
                    <span className={cn("font-medium", getMemberTextClass(viewingPost.author))}>{viewingPost.author}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <div className="flex items-center font-medium">
                    <CalendarIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                    진행일: {new Date(viewingPost.study_date || viewingPost.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-1 text-[13px] text-gray-400 font-medium">
                  <div>최초 작성: {new Date(viewingPost.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                  {viewingPost.updated_at && viewingPost.updated_at !== viewingPost.created_at && (
                    <div>수정됨: {new Date(viewingPost.updated_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                  )}
                </div>
              </div>
              
              <div className="prose prose-gray max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                {viewingPost.content}
              </div>

              {viewingPost.attachments && viewingPost.attachments.length > 0 && (
                <div className="mt-10 border-t border-gray-100 pt-8">
                  <h4 className="text-base font-bold text-gray-900 flex items-center mb-4">
                    <Paperclip className="w-5 h-5 mr-2 text-gray-400" />
                    첨부파일 <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">{viewingPost.attachments.length}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingPost.attachments.map((att, idx) => {
                      const isImage = att.type.startsWith('image/');
                      return (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group bg-white shadow-sm hover:shadow"
                        >
                          {isImage ? (
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3 flex-shrink-0">
                              <ImageIcon className="w-5 h-5 text-blue-500" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center mr-3 flex-shrink-0">
                              <FileText className="w-5 h-5 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-700">{att.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{(att.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:bg-primary-100 group-hover:border-primary-200 transition-colors ml-2 flex-shrink-0">
                            <Download className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
