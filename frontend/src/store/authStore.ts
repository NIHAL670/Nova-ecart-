import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';
import * as authService from '@/services/auth.service';
import { storageKeys } from '@/constants';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      status: 'idle',
      hasHydrated: false,

      setAuth: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),

      setUser: (user) => set({ user }),

      login: async (email, password) => {
        const res = await authService.login(email, password);
        set({ user: res.user, accessToken: res.accessToken, status: 'authenticated' });
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // best-effort server logout
        }
        set({ user: null, accessToken: null, status: 'unauthenticated' });
      },

      refreshProfile: async () => {
        if (!get().accessToken) return;
        try {
          const user = await authService.fetchMe();
          set({ user, status: 'authenticated' });
        } catch {
          set({ user: null, accessToken: null, status: 'unauthenticated' });
        }
      },

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: storageKeys.auth,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const selectIsAuthenticated = (s: AuthState) => Boolean(s.user && s.accessToken);
export const selectIsAdmin = (s: AuthState) => s.user?.role === 'admin';