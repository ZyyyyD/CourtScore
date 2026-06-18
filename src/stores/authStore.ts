import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface ProfileData {
  full_name?: string;
  nickname?: string;
  dupr_rating?: string;
  bio?: string;
}

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
  updateProfile: (data: ProfileData) => Promise<string | null>;
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    if (!data.user) return 'Sign in failed — please try again.';
    let user = data.user;
    // If full_name is missing from metadata, pull it from the profiles table
    if (!user.user_metadata?.full_name) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.full_name) {
        user = { ...user, user_metadata: { ...user.user_metadata, full_name: profile.full_name } };
      }
    }
    set({ session: data.session, user });
    return null;
  },

  signUp: async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    });
    if (error) return error.message;
    if (data.session && data.user) {
      // Session is only present when email confirmation is disabled
      set({ session: data.session, user: data.user });
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: displayName,
      }, { onConflict: 'id', ignoreDuplicates: true });
    }
    return null;
  },

  signInAsGuest: async (name: string) => {
    set({ isGuest: true, guestName: name });
    return null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isGuest: false, guestName: '' });
  },

  updateProfile: async (data) => {
    const { data: res, error } = await supabase.auth.updateUser({ data });
    if (error) return error.message;
    const u = res.user;
    await supabase.from('profiles').upsert({
      id: u.id,
      full_name: u.user_metadata.full_name ?? null,
      nickname: u.user_metadata.nickname ?? null,
      dupr_rating: u.user_metadata.dupr_rating ?? null,
      bio: u.user_metadata.bio ?? null,
    });
    set({ user: u });
    return null;
  },

  loadSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) console.error('[auth] loadSession error:', error.message);
    const s = data.session;
    set({ session: s, user: s?.user ?? null, isLoading: false });

    if (s?.user) {
      const meta = s.user.user_metadata;
      await supabase.from('profiles').upsert(
        {
          id: s.user.id,
          full_name: meta.full_name ?? null,
          nickname: meta.nickname ?? null,
          dupr_rating: meta.dupr_rating ?? null,
          bio: meta.bio ?? null,
        },
        { onConflict: 'id' },
      );
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },
}));
