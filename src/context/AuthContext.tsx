import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserSession, Profile } from './types';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: UserSession | null;
  loading: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Fetch profile helper - memoized to prevent recreating on every render
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  }, []);

  // Public refresh method
  const refreshProfile = useCallback(async () => {
    if (!session?.id) return;
    
    const freshProfile = await fetchProfile(session.id);
    if (freshProfile) {
      setProfile(freshProfile);
      setSession(prev => prev ? { ...prev, profile: freshProfile } : null);
    }
  }, [session?.id, fetchProfile]);

  // Handle session changes
  const handleSessionChange = useCallback(async (supabaseSession: Session | null) => {
    if (!supabaseSession?.user) {
      // No session - clear everything
      setSession(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    // Session exists - fetch profile
    const userProfile = await fetchProfile(supabaseSession.user.id);
    
    const userSession: UserSession = {
      id: supabaseSession.user.id,
      email: supabaseSession.user.email,
      profile: userProfile || undefined
    };

    setSession(userSession);
    setProfile(userProfile);
    setLoading(false);
  }, [fetchProfile]);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session (only once on mount)
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (mounted) {
          await handleSessionChange(currentSession);
          setInitialized(true);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []); // Empty deps - only run once on mount

  // Subscribe to auth changes AFTER initial hydration
  useEffect(() => {
    if (!initialized) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        console.log('Auth event:', event);

        // Only handle actual state changes, ignore INITIAL_SESSION
        if (event === 'INITIAL_SESSION') {
          return; // Skip - we already handled this in initializeAuth
        }

        // Handle other events: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
        await handleSessionChange(supabaseSession);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized, handleSessionChange]);

  // Sign out helper
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  }, []);

  const value: AuthContextType = {
    session,
    loading,
    profile,
    refreshProfile,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};