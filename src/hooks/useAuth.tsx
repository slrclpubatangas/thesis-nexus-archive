
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  createUser: (email: string, password: string, fullName: string) => Promise<void>;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, retryCount = 0) => {
    try {
      console.log('Fetching profile for user ID:', userId, 'Retry:', retryCount);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!data) {
        console.log('No profile found, creating one...');
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const isAdmin = userData.user.email === 'thevinz1172@gmail.com' || 
                         userData.user.email?.includes('@lpu.edu.ph');
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userData.user.email || '',
              full_name: userData.user.user_metadata?.full_name || 'Admin User',
              role: isAdmin ? 'admin' : 'reader'
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating profile:', insertError);
            // If creation fails and we haven't retried too many times, try again
            if (retryCount < 2) {
              console.log('Retrying profile creation...');
              setTimeout(() => {
                fetchUserProfile(userId, retryCount + 1);
              }, 1000);
            }
            return null;
          }

          console.log('Created new profile:', newProfile);
          setProfile(newProfile);
          return newProfile;
        }
        return null;
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('Setting up auth listener...');
    
    // Get initial session first
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          setLoading(false);
          return;
        }

        console.log('Initial session check:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && event === 'SIGNED_IN') {
          // Small delay to ensure the session is fully established
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 200);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
        
        if (event !== 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    // Get initial session
    getInitialSession();

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Sign in successful:', data.user?.email);
      // The onAuthStateChange listener will handle updating the state
    } catch (error) {
      console.error('Sign in failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const createUser = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Creating new user:', email);
      
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name: fullName,
          role: 'reader'
        },
        email_confirm: true
      });

      if (error) {
        console.error('User creation error:', error);
        throw error;
      }

      console.log('User created successfully:', data.user?.email);
    } catch (error) {
      console.error('User creation failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      // Clear state immediately
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    } catch (error) {
      console.error('Sign out failed:', error);
      // Force clear state even if signOut fails
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, signIn, signOut, createUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
