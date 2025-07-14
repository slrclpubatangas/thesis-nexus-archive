import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { updateLastLogin, checkUserStatus } from '../lib/auth-utils';

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
      window.location.reload();
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