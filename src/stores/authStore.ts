import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  guestName: string;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setGuestName: (name: string) => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signInAsGuest: (name: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  session: null,
  user: null,
  isGuest: false,
  guestName: '',
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),

  setGuestName: (name) => set({ guestName: name }),

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  },

  signUp: async (email, password, displayName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    });
    return error?.message ?? null;
  },

  signInAsGuest: async (name: string) => {
    set({ isGuest: true, guestName: name });
    return null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isGuest: false, guestName: '' });
  },

  loadSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) console.error('[auth] loadSession error:', error.message);
    const s = data.session;
    set({ session: s, user: s?.user ?? null, isLoading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },
}));
