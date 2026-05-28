import { createClient } from '@supabase/supabase-js';
import type { Post, Comment, Bookmark } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const api = {
  async getPosts(): Promise<Post[]> {
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. Returning empty posts.");
      return [];
    }
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
    return data || [];
  },

  async addPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at'>) {
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. Cannot add post.");
      return;
    }

    const { error } = await supabase
      .from('posts')
      .insert([{
        ...post,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
      
    if (error) {
      console.error('Error adding post:', error);
      throw error;
    }
  },

  async updatePost(id: string, updates: Partial<Omit<Post, 'id' | 'created_at' | 'author'>>) {
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. Cannot update post.");
      return;
    }

    const { error } = await supabase
      .from('posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  async deletePost(id: string) {
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. Cannot delete post.");
      return;
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  async getComments(postId: string): Promise<Comment[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
    return data || [];
  },

  async addComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>) {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('comments')
      .insert([{
        ...comment,
        created_at: new Date().toISOString()
      }]);
      
    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  async updateComment(id: string, content: string) {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('comments')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  async deleteComment(id: string) {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  async getBookmarks(): Promise<Bookmark[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('bookmarks')
      .select('*');
      
    if (error) {
      console.error('Error fetching bookmarks:', error);
      throw error;
    }
    return data || [];
  },

  async toggleBookmark(postId: string, author: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    // Check if exists
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('author', author)
      .single();

    if (data) {
      // Remove
      await supabase.from('bookmarks').delete().eq('id', data.id);
      return false;
    } else {
      // Add
      await supabase.from('bookmarks').insert([{
        post_id: postId,
        author,
        created_at: new Date().toISOString()
      }]);
      return true;
    }
  },

  async getCategories(): Promise<string[]> {
    if (!isSupabaseConfigured) return [];
    
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    
    return data.map(row => row.name) || [];
  },

  async addCategory(name: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('categories')
      .insert([{ name }]);
      
    if (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }
};
