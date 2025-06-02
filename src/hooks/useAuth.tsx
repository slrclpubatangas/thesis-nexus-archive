
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user role from profiles table
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return 'reader'; // Default to reader role
      }

      return data?.role || 'reader';
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      return 'reader';
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          const role = await fetchUserRole(session.user.id);
          setUserRole(role);
          console.log('User role determined:', role);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        const role = await fetchUserRole(session.user.id);
        setUserRole(role);
        console.log('Initial user role:', role);
      } else {
        setUserRole(null);
      }
      
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
      
      // The onAuthStateChange listener will handle updating the state and role
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const createUser = async (email: string, password: string, fullName: string): Promise<void> => {
    try {
      console.log('Creating new user:', email);
      
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name: fullName,
          role: 'reader'
        },
        email_confirm: false // Skip email confirmation for admin-created users
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
      setUserRole(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, signIn, signOut, createUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
