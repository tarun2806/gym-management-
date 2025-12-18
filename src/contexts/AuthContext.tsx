import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Extend the user interface
interface User {
  id: string;
  username: string;
  email: string | undefined;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'user';
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Map Supabase user to our internal User interface
  const mapUser = (sbUser: SupabaseUser): User => {
    // Check for role in app_metadata (secure) or user_metadata (public/client)
    // Default to 'user' if no role is found
    const rawRole = sbUser.app_metadata?.role || sbUser.user_metadata?.role || 'user';
    const role = String(rawRole).toLowerCase();

    return {
      id: sbUser.id,
      username: sbUser.email?.split('@')[0] || 'User',
      email: sbUser.email,
      role: role as any,
      permissions: ['all'] // simplified for now
    };
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapUser(session.user));
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapUser(session.user));
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Fallback for demo purposes if no Supabase configured
        if (email === 'owner' && password === 'password') {
          const demoUser: User = {
            id: 'demo-owner',
            username: 'Owner',
            email: 'owner@gympro.com',
            role: 'owner',
            permissions: ['all']
          };
          setUser(demoUser);
          setIsAuthenticated(true);
          return true;
        }

        if (email === 'admin' && password === 'password') {
          const demoUser: User = {
            id: 'demo-1',
            username: 'admin',
            email: 'admin@gympro.com',
            role: 'admin',
            permissions: ['all']
          };
          setUser(demoUser);
          setIsAuthenticated(true);
          return true;
        }
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signUp,
    signInWithGoogle,
    resetPassword,
    logout,
    hasPermission,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
