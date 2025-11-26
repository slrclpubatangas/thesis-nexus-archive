// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, ensureValidSession } from '../integrations/supabase/client';
import { updateLastLogin, checkUserStatus } from '../lib/auth-utils';
import { toast } from '../hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  isVerifying: boolean;
  setIsVerifying: (value: boolean) => void;
  shouldShowRefreshBanner: boolean;
  dismissRefreshBanner: () => void;
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [shouldShowRefreshBanner, setShouldShowRefreshBanner] = useState(false);
  const cleanupRef = useRef<{
    subscriptions: (() => void)[];
    timeouts: NodeJS.Timeout[];
    mounted: boolean;
  }>({ subscriptions: [], timeouts: [], mounted: true });

  /* ---------- 1. INITIAL AUTH CHECK ---------- */
  useEffect(() => {
    cleanupRef.current.mounted = true;
    const retryCount = 0;
    const maxRetries = 3;

    const initializeAuth = async (attempt = 1) => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (cleanupRef.current.mounted && initialSession?.user) {
          try {
            // Check if this is a first-time email confirmation
            const { data: userData } = await supabase
              .from('system_users')
              .select('last_login')
              .eq('user_id', initialSession.user.id)
              .single();

            const isFirstTimeEmailConfirm = userData && !userData.last_login &&
              !sessionStorage.getItem('2fa_verified');

            if (isFirstTimeEmailConfirm) {
              console.log('🔒 First-time email confirmation detected on initial load - signing out');
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);

              toast({
                title: 'Email Confirmed',
                description: 'Please login with your email and password to continue.',
              });

              // Redirect to login page
              window.location.hash = 'login';
              return;
            }

            const isActive = await checkUserStatus(initialSession.user.id);
            if (!isActive) {
              console.log('User is inactive, signing out...');
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              toast({
                title: 'Account Inactive',
                description: 'Your account has been deactivated.',
                variant: 'destructive',
              });
            } else {
              setSession(initialSession);
              setUser(initialSession.user);
              console.log('✅ Authenticated user:', initialSession.user.email);
            }
          } catch (statusError) {
            console.error('User status check failed:', statusError);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              return initializeAuth(attempt + 1);
            }
            throw statusError;
          }
        } else if (cleanupRef.current.mounted) {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error(`Initial auth check failed (attempt ${attempt}/${maxRetries}):`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          return initializeAuth(attempt + 1);
        }
        toast({
          title: 'Connection Error',
          description: 'Failed to initialize authentication. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        if (cleanupRef.current.mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    /* ---------- 2. AUTH STATE LISTENER ---------- */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!cleanupRef.current.mounted) return;
        console.log('Auth state changed:', event, session?.user?.email);

        if (!initialized) return;

        if (event === 'SIGNED_IN' && session?.user) {
          // Don't update auth state if we're in verification mode
          if (isVerifying) {
            console.log('⏸️  Skipping auth state update during verification');
            return;
          }

          /* ALWAYS stamp the login time for every role / every flow */
          await updateLastLogin(session.user.id);

          // Show refresh banner if already initialized (not initial sign in)
          if (initialized && user) {
            console.log('🔔 Session updated - showing refresh banner');
            setShouldShowRefreshBanner(true);
          }

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
      cleanupRef.current.mounted = false;
      cleanupRef.current.subscriptions.push(subscription.unsubscribe);
    };
  }, [initialized, isVerifying]);

  /* ---------- 3. OPTIMIZED PERIODIC STATUS CHECK ---------- */
  useEffect(() => {
    if (!user?.id || !cleanupRef.current.mounted) return;

    // Reduce frequency to prevent excessive API calls
    const interval = setInterval(async () => {
      if (!cleanupRef.current.mounted) return;

      try {
        console.log('⏱️ Periodic check for:', user.email);

        // Only check user status, let Supabase handle token refresh automatically
        const isActive = await checkUserStatus(user.id);
        if (!isActive && cleanupRef.current.mounted) {
          console.log('🚪 User inactive – forcing logout');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          toast({
            title: 'Account Deactivated',
            description: 'Your account has been deactivated by an administrator.',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('❌ Error in periodic check:', err);
        // Don't force logout on network errors
      }
    }, 600_000); // Increased to 10 minutes to reduce load

    cleanupRef.current.timeouts.push(interval);
    return () => {
      clearInterval(interval);
      const index = cleanupRef.current.timeouts.indexOf(interval);
      if (index > -1) {
        cleanupRef.current.timeouts.splice(index, 1);
      }
    };
  }, [user?.id]);

  /* ---------- 4. PAGE VISIBILITY CHANGE HANDLER ---------- */
  useEffect(() => {
    if (!user?.id) return;

    let lastHiddenTime: number | null = null;
    const MIN_AWAY_TIME = 60000; // 1 minute in milliseconds

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Page is now hidden, record the time
        lastHiddenTime = Date.now();
      } else {
        // Page is now visible, check how long we were away
        if (lastHiddenTime) {
          const awayDuration = Date.now() - lastHiddenTime;

          // Only validate session if we were away for more than 1 minute
          if (awayDuration > MIN_AWAY_TIME) {
            console.log(`📱 Page became visible after ${Math.round(awayDuration / 1000)}s, validating session...`);
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
          } else {
            console.log(`📱 Page became visible after ${Math.round(awayDuration / 1000)}s, skipping validation (< 1 min)`);
            // Show refresh banner when page becomes visible (even if less than 1 min)
            if (user) {
              console.log('🔔 Page became visible - showing refresh banner');
              setShouldShowRefreshBanner(true);
            }
          }
          lastHiddenTime = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle window focus events with the same logic
    let lastBlurTime: number | null = null;

    const handleBlur = () => {
      lastBlurTime = Date.now();
    };

    const handleFocus = async () => {
      if (lastBlurTime) {
        const awayDuration = Date.now() - lastBlurTime;

        // Only validate if away for more than 1 minute
        if (awayDuration > MIN_AWAY_TIME) {
          console.log(`🔍 Window focused after ${Math.round(awayDuration / 1000)}s, validating session...`);
          try {
            const sessionValid = await ensureValidSession();
            if (!sessionValid) {
              console.log('🚪 Session invalid on focus – forcing logout');
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
            console.error('❌ Error validating session on focus:', error);
          }
        } else {
          console.log(`🔍 Window focused after ${Math.round(awayDuration / 1000)}s, skipping validation (< 1 min)`);
        }
        lastBlurTime = null;
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
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

      /* 2. Check user status BEFORE updating last_login */
      const { data: userData } = await supabase
        .from('system_users')
        .select('status, last_login')
        .eq('user_id', data.user.id)
        .single();

      const isActive = userData?.status === 'Active';
      const isFirstTimeLogin = !userData?.last_login;

      // Allow if Active OR if Inactive but never logged in (first-time setup)
      if (!isActive && !isFirstTimeLogin) {
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated. Please contact an administrator.');
      }

      /* 3. THEN update last_login after status check passes */
      await updateLastLogin(data.user.id);

      console.log('Sign in successful:', data.user?.email);
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user...');

      // Clear all session storage first
      sessionStorage.clear();
      localStorage.removeItem('supabase.auth.token');

      // Clear state immediately
      setSession(null);
      setUser(null);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error during signOut:', error);
        // Even if there's an error, we still want to redirect
      }

      console.log('Sign out successful, redirecting to home...');

      // Force a hard reload to clear all state
      window.location.replace('/');
    } catch (error) {
      console.error('Unexpected error during signOut:', error);
      // Force redirect anyway
      window.location.replace('/');
    }
  };

  useEffect(() => {
    return () => {
      cleanupRef.current.mounted = false;
      cleanupRef.current.subscriptions.forEach(unsub => unsub());
      cleanupRef.current.timeouts.forEach(clearTimeout);
    };
  }, []);

  const dismissRefreshBanner = () => {
    setShouldShowRefreshBanner(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      signIn,
      signOut,
      loading,
      isVerifying,
      setIsVerifying,
      shouldShowRefreshBanner,
      dismissRefreshBanner
    }}>
      {children}
    </AuthContext.Provider>
  );
};