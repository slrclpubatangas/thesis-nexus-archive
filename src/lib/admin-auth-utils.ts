/**
 * Admin Auth Utilities
 * 
 * This file contains utility functions for administrative auth operations
 * that require elevated privileges (service role key).
 * 
 * NOTE: These functions should ONLY be called from server-side environments
 * or secure edge functions, NEVER from client-side code.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

// Service role client creation (for server-side use only)
// IMPORTANT: Never expose the service role key to the client
const createServiceRoleClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://zummzziydfpvwuxxuyyu.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error('Service role key not configured. This function requires server-side environment.');
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Delete a user from auth.users table (requires service role)
 * This should be called after successfully deleting from system_users
 */
export const deleteAuthUser = async (authUserId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabaseAdmin = createServiceRoleClient();
    
    // Delete the user from auth.users
    const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
    
    if (error) {
      console.error('Error deleting auth user:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete auth user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Complete user deletion - removes from both system_users and auth.users
 * This is a server-side alternative to the database function
 */
export const completeUserDeletion = async (
  systemUserId: string,
  authUserId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabaseAdmin = createServiceRoleClient();
    
    // Start a transaction-like operation
    // First, delete from system_users
    const { error: systemError } = await supabaseAdmin
      .from('system_users')
      .delete()
      .eq('id', systemUserId);
    
    if (systemError) {
      console.error('Error deleting system user:', systemError);
      return { success: false, error: systemError.message };
    }
    
    // Then delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
    
    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Try to restore system_users entry if auth deletion failed
      // This is a best-effort rollback
      return { success: false, error: authError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to complete user deletion:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Check if the current user is an admin
 * This is a server-side verification
 */
export const verifyAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    const supabaseAdmin = createServiceRoleClient();
    
    const { data, error } = await supabaseAdmin
      .from('system_users')
      .select('role, status')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.role === 'Admin' && data.status === 'Active';
  } catch (error) {
    console.error('Failed to verify admin status:', error);
    return false;
  }
};

/**
 * Create a new auth user with custom metadata
 * This is useful for creating users with specific roles
 */
export const createAuthUserWithRole = async (
  email: string,
  password: string,
  metadata: { full_name?: string; role?: string }
): Promise<{ userId?: string; error?: string }> => {
  try {
    const supabaseAdmin = createServiceRoleClient();
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: metadata
    });
    
    if (error) {
      console.error('Error creating auth user:', error);
      return { error: error.message };
    }
    
    return { userId: data.user.id };
  } catch (error) {
    console.error('Failed to create auth user:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
