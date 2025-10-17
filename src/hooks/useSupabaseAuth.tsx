import { useCallback } from 'react';
import { supabase, ensureValidSession } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook that provides authenticated Supabase operations with automatic session validation
 * This ensures all API calls are made with valid tokens and handles session refresh
 */
export const useSupabaseAuth = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();

  const executeWithAuth = useCallback(async (
    operation: () => Promise<any>,
    options: {
      onError?: (error: any) => void;
      showErrorToast?: boolean;
    } = {}
  ): Promise<any> => {
    const { onError, showErrorToast = true } = options;
    
    try {
      // First, ensure we have a valid session
      const sessionValid = await ensureValidSession();
      
      if (!sessionValid) {
        console.error('❌ Session invalid, signing out...');
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please login again.',
          variant: 'destructive',
        });
        signOut();
        return null;
      }

      // Execute the operation with a valid session
      console.log('✅ Session valid, executing operation...');
      return await operation();
      
    } catch (error: any) {
      console.error('❌ Operation failed:', error);
      
      // Handle authentication errors specifically
      if (error?.message?.includes('JWT') || 
          error?.message?.includes('refresh_token_not_found') ||
          error?.code === 'PGRST301' ||
          error?.status === 401 ||
          error?.status === 403) {
        
        console.error('🔐 Authentication error detected, signing out...');
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please login again.',
          variant: 'destructive',
        });
        signOut();
        return null;
      }
      
      // Handle other errors
      if (onError) {
        onError(error);
      } else if (showErrorToast) {
        toast({
          title: 'Operation Failed',
          description: error?.message || 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
      }
      
      throw error;
    }
  }, [signOut, toast]);

  // Wrapper for Supabase queries
  const queryWithAuth = useCallback(async (queryBuilder: any, options?: { onError?: (error: any) => void; showErrorToast?: boolean }) => {
    return executeWithAuth(async () => {
      const result = await queryBuilder;
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    }, options);
  }, [executeWithAuth]);

  // Wrapper for Supabase mutations (insert, update, delete)
  const mutateWithAuth = useCallback(async (mutationBuilder: any, options?: { onError?: (error: any) => void; showErrorToast?: boolean }) => {
    return executeWithAuth(async () => {
      const result = await mutationBuilder;
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    }, options);
  }, [executeWithAuth]);

  return {
    /**
     * Execute any operation with authentication validation
     */
    executeWithAuth,
    /**
     * Execute a Supabase query with authentication validation
     */
    queryWithAuth,
    /**
     * Execute a Supabase mutation with authentication validation
     */
    mutateWithAuth,
    /**
     * Direct access to the Supabase client (use with caution)
     */
    supabase,
  };
};
