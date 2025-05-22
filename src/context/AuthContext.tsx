
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import * as userService from '@/services/user';
import { type User } from '@/services/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signInWithSpotify: () => Promise<boolean>;
  signUp: (email: string, password: string, display_name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial session check
  useEffect(() => {
    async function getInitialSession() {
      try {
        setLoading(true);
        
        // Get session and user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userData = await userService.getCurrentUser();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = await userService.getCurrentUser();
        setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error signing in with email:', error);
        return false;
      }

      // Get user data after successful sign-in
      if (data.user) {
        const userData = await userService.getCurrentUser();
        setUser(userData);
      }
      
      return true;
    } catch (error) {
      console.error('Error signing in with email:', error);
      return false;
    }
  };

  // Sign in with Spotify
  const signInWithSpotify = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Error signing in with Spotify:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error signing in with Spotify:', error);
      return false;
    }
  };

  // Sign up with email
  const signUp = async (email: string, password: string, display_name: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name,
          }
        }
      });

      if (error) {
        console.error('Error signing up:', error);
        return false;
      }

      if (data.user) {
        // Create user record in database
        await userService.upsertUser(
          data.user.id,
          email,
          null,
          display_name,
          null
        );
      }

      return true;
    } catch (error) {
      console.error('Error signing up:', error);
      return false;
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signInWithEmail,
    signInWithSpotify,
    signUp,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
