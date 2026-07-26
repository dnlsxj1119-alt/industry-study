import { MEMBERS } from '../constants/members';

export type Member = typeof MEMBERS[number];
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
  contribution_point: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id?: string;
  book_id?: string;
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

export interface Notification {
  id: string;
  recipient_id: Member;
  actor_id: Member;
  type: 'comment';
  post_id?: string;
  book_id?: string;
  comment_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface WeeklyGoal {
  week_start_date: string;
  target_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface AppUpdate {
  id: string;
  title: string;
  content: string;
  author_id: Member;
  created_at: string;
  updated_at: string;
}

export type BookStatus = '읽고 싶은 책' | '읽는 중' | '완독';

export interface Book {
  id: string;
  title: string;
  author?: string;
  category?: string;
  status: BookStatus;
  reason?: string;
  core_topic?: string;
  content?: string;
  learning?: string;
  application?: string;
  contribution_point?: number;
  study_date?: string;
  member: Member;
  created_at: string;
  updated_at: string;
}
