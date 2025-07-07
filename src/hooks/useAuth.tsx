
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Function to update or create last login timestamp
const updateLastLogin = async (userId: string) => {
  try {
    console.log('Updating last login for user:', userId);
    
    // First, try to update existing record
    const { data: updateData, error: updateError } = await supabase
      .from('system_users')
      .update({ last_login: new Date().toISOString() })
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.error('Error updating last login:', updateError);
      return;
    }

    // If no rows were updated, the user doesn't exist in system_users
    if (!updateData || updateData.length === 0) {
      console.log('User not found in system_users, checking if we should create record...');
      
      // Get user info from auth.users to create system_users record
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('Creating system_users record for:', user.email);
        const { error: insertError } = await supabase
          .from('system_users')
          .insert([{
            user_id: userId,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
            email: user.email || '',
            role: 'Reader' as const,
            status: 'Active' as const,
            last_login: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('Error creating system_users record:', insertError);
        } else {
          console.log('Successfully created system_users record with login timestamp');
        }
      }
    } else {
      console.log('Successfully updated last login timestamp');
    }
  } catch (error) {
    console.error('Failed to update last login:', error);
  }
};

// Function to check if user is active
const checkUserStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('system_users')
      .select('status')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking user status:', error);
      // If user doesn't exist in system_users, allow login (new users)
      return true;
    }

    return data.status === 'Active';
  } catch (error) {
    console.error('Failed to check user status:', error);
    // Default to allowing login if we can't check status
    return true;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          console.log('Initial session check:', initialSession?.user?.email);
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setInitialized(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Only process events after initialization
        if (!initialized) return;
        
        // Check user status before setting session for signed-in users
        if (event === 'SIGNED_IN' && session?.user) {
          const isActive = await checkUserStatus(session.user.id);
          
          if (!isActive) {
            console.log('User is inactive, signing out...');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            return;
          }
          
          // User is active, proceed with login
          setSession(session);
          setUser(session.user);
          
          // Use setTimeout to defer the database call and prevent potential deadlocks
          setTimeout(() => {
            updateLastLogin(session.user.id);
          }, 100);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  // Update loading state when initialization is complete
  useEffect(() => {
    if (initialized) {
      setLoading(false);
    }
  }, [initialized]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      if (data.user) {
        // Check if user is active before completing sign in
        const isActive = await checkUserStatus(data.user.id);
        
        if (!isActive) {
          // Sign out immediately if user is inactive
          await supabase.auth.signOut();
          throw new Error('Your account has been deactivated. Please contact an administrator.');
        }
      }

      console.log('Sign in successful:', data.user?.email);
      // The onAuthStateChange listener will handle updating the state and last login
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      console.log('Sign out successful');
      // The onAuthStateChange listener will handle updating the state
    } catch (error) {
      console.error('Sign out failed:', error);
      // Force clear state even if signOut fails
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
