import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { auth } from '../auth';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,

  initialize: async () => {
    try {
      const session = await auth.getSession();
      const user = session?.user ?? null;
      set({ session, user, loading: false });

      // Listen to auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null });
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ session: null, user: null, loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    const data = await auth.signIn(email, password);
    set({ session: data.session, user: data.user });
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    const data = await auth.signUp(email, password, fullName);
    set({ session: data.session, user: data.user });
  },

  signOut: async () => {
    await auth.signOut();
    set({ session: null, user: null });
  },
}));
