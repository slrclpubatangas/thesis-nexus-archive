
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Update last login timestamp when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          // Use setTimeout to defer the database call and prevent potential deadlocks
          setTimeout(() => {
            updateLastLogin(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

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
