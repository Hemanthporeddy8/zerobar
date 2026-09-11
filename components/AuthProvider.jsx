'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { apiGetAuthUser, apiAuthLogout } from '../lib/apiClient';

const AuthContext = createContext({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initUser() {
      if (isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setUser(data.session.user);
          setLoading(false);
          return;
        }
      }

      const apiUser = await apiGetAuthUser();
      setUser(apiUser || null);
      setLoading(false);
    }

    initUser();

    if (isTursoConfiguredOrSupabase(isSupabaseConfigured)) {
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return () => listener?.subscription?.unsubscribe();
    }
  }, []);

  function isTursoConfiguredOrSupabase(supabaseActive) {
    return Boolean(supabaseActive);
  }

  async function signOut() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    await apiAuthLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
