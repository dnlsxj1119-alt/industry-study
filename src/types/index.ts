export type Member = '다연' | '유연' | '준순';
export type Category = string;
export type CommentType = '동의' | '반론' | '추가자료' | '질문';

export interface Post {
  id: string;
  title: string;
  url?: string;
  source: string;
  summary: string;
  opinion: string;
  content?: string;
  category: Exclude<Category, '전체'>;
  tags: string[];
  author: Member;
  study_date: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author: Member;
  type: CommentType;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface Bookmark {
  id: string;
  post_id: string;
  author: Member;
  created_at: string;
}

export interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Presentation {
  id: string;
  title: string;
  author: Member;
  content: string;
  study_date?: string;
  tags: string[];
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}
