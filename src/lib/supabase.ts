import { createClient } from '@supabase/supabase-js';
import type { Post, Comment, Bookmark, Presentation, AppUpdate } from '../types';

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
  },

  // --- Presentations ---
  async getPresentations(): Promise<Presentation[]> {
    if (!isSupabaseConfigured) return [];
    
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching presentations:', error);
      return [];
    }
    return data || [];
  },

  async addPresentation(presentation: Omit<Presentation, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('presentations')
      .insert([presentation]);
      
    if (error) {
      console.error('Error adding presentation:', error);
      throw error;
    }
  },

  async updatePresentation(id: string, updates: Partial<Omit<Presentation, 'id' | 'created_at' | 'author'>>): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('presentations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating presentation:', error);
      throw error;
    }
  },

  async deletePresentation(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('presentations')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting presentation:', error);
      throw error;
    }
  },

  async uploadPresentationFile(file: File): Promise<string> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');
    
    const fileExt = file.name.split('.').pop();
    // Keep the original name somewhat for better URLs but ensure uniqueness
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeName}`;
    const filePath = `attachments/${fileName}`;

    const { error } = await supabase.storage
      .from('presentations')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    const { data } = supabase.storage
      .from('presentations')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // --- Notifications ---
  async getNotifications(member: string): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', member)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data || [];
  },

  async addNotification(notification: any) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('notifications')
      .insert([{
        ...notification,
        is_read: false,
        created_at: new Date().toISOString()
      }]);
      
    if (error) {
      console.error('Error adding notification:', error);
    }
  },

  async markNotificationAsRead(id: string) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
      
    if (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // --- Weekly Goals ---
  async getWeeklyGoal(weekStartDate: string): Promise<number> {
    if (!isSupabaseConfigured) return 5; // Default fallback
    
    const { data, error } = await supabase
      .from('weekly_goals')
      .select('target_count')
      .eq('week_start_date', weekStartDate)
      .single();
      
    if (error) {
      // If no row exists or error, default to 5
      return 5;
    }
    
    return data ? data.target_count : 5;
  },

  async setWeeklyGoal(weekStartDate: string, targetCount: number) {
    if (!isSupabaseConfigured) return;
    
    const { error } = await supabase
      .from('weekly_goals')
      .upsert({
        week_start_date: weekStartDate,
        target_count: targetCount,
        updated_at: new Date().toISOString()
      }, { onConflict: 'week_start_date' });
      
    if (error) {
      console.error('Error setting weekly goal:', error);
      throw error;
    }
  },

  // --- Updates ---
  async getUpdates(): Promise<AppUpdate[]> {
    if (!isSupabaseConfigured) return [];
    
    const { data, error } = await supabase
      .from('updates')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching updates:', error);
      return [];
    }
    
    return data || [];
  },

  async addUpdate(update: Omit<AppUpdate, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    if (!isSupabaseConfigured) return;
    
    const { error } = await supabase
      .from('updates')
      .insert([update]);
      
    if (error) {
      console.error('Error adding update:', error);
      throw error;
    }
  },

  async editUpdate(id: string, update: Partial<Omit<AppUpdate, 'id' | 'created_at' | 'author_id'>>): Promise<void> {
    if (!isSupabaseConfigured) return;
    
    const { error } = await supabase
      .from('updates')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', id);
      
    if (error) {
      console.error('Error editing update:', error);
      throw error;
    }
  },

  async deleteUpdate(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    
    const { error } = await supabase
      .from('updates')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting update:', error);
      throw error;
    }
  }
};
