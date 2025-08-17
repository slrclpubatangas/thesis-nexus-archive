// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, ensureValidSession } from '../integrations/supabase/client';
import { updateLastLogin, checkUserStatus } from '../lib/auth-utils';
import { toast } from '../hooks/use-toast';

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

  /* ---------- 1. INITIAL AUTH CHECK ---------- */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (mounted && initialSession?.user) {
          const isActive = await checkUserStatus(initialSession.user.id);
          if (!isActive) {
            console.log('User is inactive, signing out...');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
          } else {
            setSession(initialSession);
            setUser(initialSession.user);
          }
        } else if (mounted) {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    /* ---------- 2. AUTH STATE LISTENER ---------- */
    /* ---------- 2. AUTH STATE LISTENER ---------- */
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    if (!mounted) return;
    console.log('Auth state changed:', event, session?.user?.email);

    if (!initialized) return;

    if (event === 'SIGNED_IN' && session?.user) {
      /* ALWAYS stamp the login time for every role / every flow */
      await updateLastLogin(session.user.id);

      setSession(session);
      setUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      setSession(null);
      setUser(null);
    } else {
      setSession(session);
      setUser(session?.user ?? null);
    }
  }
);
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized]);

  /* ---------- 3. PERIODIC STATUS CHECK (every 5 min) ---------- */
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(async () => {
      try {
        console.log('⏱️ Periodic check for:', user.email);
        
        // First check if session is valid and refresh token if needed
        const sessionValid = await ensureValidSession();
        if (!sessionValid) {
          console.log('🚪 Session invalid – forcing logout');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please login again.',
            variant: 'destructive',
          });
          return;
        }
        
        // Then check user status
        const isActive = await checkUserStatus(user.id);
        if (!isActive) {
          console.log('🚪 User inactive – forcing logout');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          toast({
            title: 'Account Deactivated',
            description: 'Your account has been deactivated by an administrator.',
            variant: 'destructive',
          });
          window.location.reload();
        }
      } catch (err) {
        console.error('❌ Error in periodic check:', err);
      }
    }, 300_000); // 5 minutes

    return () => clearInterval(interval);
  }, [user?.id]);
  
  /* ---------- 4. PAGE VISIBILITY CHANGE HANDLER ---------- */
  useEffect(() => {
    if (!user?.id) return;

    const handleVisibilityChange = async () => {
      // When page becomes visible again, validate session
      if (!document.hidden) {
        console.log('📱 Page became visible, validating session...');
        try {
          const sessionValid = await ensureValidSession();
          if (!sessionValid) {
            console.log('🚪 Session invalid on visibility change – forcing logout');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            toast({
              title: 'Session Expired',
              description: 'Your session has expired. Please login again.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('❌ Error validating session on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also handle window focus events
    const handleFocus = () => {
      handleVisibilityChange();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id]);

  /* ---------- 5. LOADING STATE CLEANUP ---------- */
  useEffect(() => {
    if (initialized) setLoading(false);
  }, [initialized]);

  /* ---------- 6. AUTH METHODS ---------- */
 /* ---------- 5. AUTH METHODS ---------- */
const signIn = async (email: string, password: string) => {
  try {
    console.log('Attempting to sign in with:', email);

    /* 1. Authenticate with Supabase */
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    /* 2. ALWAYS update last_login, no matter the role */
    await updateLastLogin(data.user.id);

    /* 3. Then decide if the session continues */
    const isActive = await checkUserStatus(data.user.id);
    if (!isActive) {
      await supabase.auth.signOut();
      throw new Error('Your account has been deactivated. Please contact an administrator.');
    }

    console.log('Sign in successful:', data.user?.email);
  } catch (error) {
    console.error('Sign in failed:', error);
    throw error;
  }
};

const signOut = () =>
  supabase.auth.signOut().finally(() => {
    setSession(null);
    setUser(null);
    window.location.href = '/';
  });

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};