// src/contexts/AuthContext.jsx
// COMPLETE FIX - Copy this ENTIRE file

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const res = await supabase.auth.getSession();
        const session = res?.data?.session ?? null;
        if (session?.user) setUser(session.user);
        else setUser(null);
      } catch (e) {
        console.error('Error getting initial session', e);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser(session.user);
      else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      try { sub?.data?.subscription?.unsubscribe?.(); } catch (_) {}
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
    } catch (e) {
      console.warn('signOut error', e);
      try { await supabase.auth.signOut(); } catch (_) {}
    } finally {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      try { window.location.href = '/login'; } catch (_) {}
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};