import { createClient } from '@supabase/supabase-js';
import { mockPosts, mockComments, mockBookmarks } from './mockData';
import { Post, Comment, Bookmark, Member } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local state for fallback when Supabase is not configured
let localPosts = [...mockPosts];
let localComments = [...mockComments];
let localBookmarks = [...mockBookmarks];

// Abstracted DB operations to handle fallback transparently
export const api = {
  async getPosts(): Promise<Post[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching posts:', error);
        return localPosts;
      }
      return data;
    }
    return localPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async addPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<Post> {
    const newPost = {
      ...post,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Post;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('posts').insert([newPost]).select().single();
      if (error) {
        console.error('Error adding post:', error);
      } else {
        return data;
      }
    }
    
    localPosts = [newPost, ...localPosts];
    return newPost;
  },

  async getComments(postId: string): Promise<Comment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching comments:', error);
        return localComments.filter(c => c.post_id === postId);
      }
      return data;
    }
    return localComments.filter(c => c.post_id === postId);
  },

  async addComment(comment: Omit<Comment, 'id' | 'created_at'>): Promise<Comment> {
    const newComment = {
      ...comment,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    } as Comment;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('comments').insert([newComment]).select().single();
      if (error) {
        console.error('Error adding comment:', error);
      } else {
        return data;
      }
    }

    localComments = [...localComments, newComment];
    return newComment;
  },

  async getBookmarks(): Promise<Bookmark[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('bookmarks').select('*');
      if (error) {
        console.error('Error fetching bookmarks:', error);
        return localBookmarks;
      }
      return data;
    }
    return localBookmarks;
  },

  async toggleBookmark(postId: string, author: Member): Promise<boolean> {
    const existingIndex = localBookmarks.findIndex(b => b.post_id === postId && b.author === author);
    
    if (isSupabaseConfigured && supabase) {
      if (existingIndex >= 0) {
        await supabase.from('bookmarks').delete().eq('post_id', postId).eq('author', author);
      } else {
        await supabase.from('bookmarks').insert([{ post_id: postId, author }]);
      }
      // Note: In a real app, you'd fetch the fresh state or handle errors better.
    }

    if (existingIndex >= 0) {
      localBookmarks = localBookmarks.filter((_, idx) => idx !== existingIndex);
      return false; // unbookmarked
    } else {
      localBookmarks = [...localBookmarks, { id: crypto.randomUUID(), post_id: postId, author, created_at: new Date().toISOString() }];
      return true; // bookmarked
    }
  }
};
