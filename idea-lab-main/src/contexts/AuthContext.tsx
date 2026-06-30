import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import apiClient from "@/lib/api";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signInWithGithub: () => Promise<{ data: any; error: any }>;
  syncWithBackend: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Guards to prevent the auth event loop ──
  // Track which user ID we've already synced so we never sync twice for the same session
  const syncedUserIdRef = useRef<string | null>(null);
  // Track the current user ID to skip redundant setUser/setSession calls
  const currentUserIdRef = useRef<string | null>(null);

  const syncWithBackend = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) {
        return;
      }

      console.log('[AuthContext] Syncing user with backend...');
      await apiClient.get('/api/users/me');
      console.log('[AuthContext] User synced with backend successfully');
    } catch (error) {
      console.warn('[AuthContext] Backend sync failed:', error);
    }
  }, []);

  useEffect(() => {
    console.log('[AuthContext] Initializing provider...');

    // For public blog routes, skip auth initialization entirely — audience visitors
    // don't have sessions, so calling getSession() is wasted work that delays rendering.
    const isPublicBlogRoute = window.location.pathname.startsWith('/p/');
    if (isPublicBlogRoute) {
      console.log('[AuthContext] Public blog route detected — skipping auth init');
      setLoading(false);
      return;
    }

    // 1. Check for initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        const initialUser = initialSession?.user ?? null;
        setSession(initialSession);
        setUser(initialUser);
        currentUserIdRef.current = initialUser?.id ?? null;

        // Sync on initial load if we have a session
        if (initialUser && initialSession?.access_token) {
          syncedUserIdRef.current = initialUser.id;
          syncWithBackend();
        }
      } catch (error) {
        console.error('[AuthContext] Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[AuthContext] Auth state changed:', event);

        const newUserId = currentSession?.user?.id ?? null;

        // Skip redundant updates — if the user ID hasn't changed, don't trigger re-renders.
        // This prevents the cascade: SIGNED_IN → setUser → re-render → hooks re-fire → etc.
        if (newUserId === currentUserIdRef.current && event !== 'SIGNED_OUT') {
          // Still update session silently in case the token was refreshed
          if (currentSession) {
            setSession(currentSession);
          }
          return;
        }

        // Batch state updates with setTimeout to avoid React mid-render issues
        // (recommended by Supabase: https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
        setTimeout(() => {
          currentUserIdRef.current = newUserId;
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }, 0);

        // Only sync with backend ONCE per unique sign-in
        if (
          event === 'SIGNED_IN' &&
          currentSession?.access_token &&
          newUserId &&
          syncedUserIdRef.current !== newUserId
        ) {
          syncedUserIdRef.current = newUserId;
          syncWithBackend();
        }

        // Reset sync flag on sign-out so next sign-in syncs again
        if (event === 'SIGNED_OUT') {
          syncedUserIdRef.current = null;
          currentUserIdRef.current = null;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    return await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signInWithGoogle = async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  const signInWithGithub = async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      syncedUserIdRef.current = null;
      currentUserIdRef.current = null;
      setSession(null);
      setUser(null);
      return { error };
    } catch (error) {
      console.error('[AuthContext] signOut exception:', error);
      syncedUserIdRef.current = null;
      currentUserIdRef.current = null;
      setSession(null);
      setUser(null);
      return { error: null };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signOut, 
      signUp, 
      signIn, 
      signInWithGoogle, 
      signInWithGithub, 
      syncWithBackend 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

export { AuthContext };
