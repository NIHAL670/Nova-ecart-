'use client';

import { useEffect, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { useAuthStore } from '@/store/authStore';
import { setUnauthorizedHandler } from '@/lib/api';
import { useRouter } from 'next/navigation';

function HydrationGate({ children }: { children: ReactNode }) {
  // Zustand persist rehydrates on the client; render children only after that.
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  if (!hasHydrated) return null;
  return <>{children}</>;
}

function SessionManager() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (hasHydrated) {
      void refreshProfile();
    }
  }, [hasHydrated, refreshProfile]);

  useEffect(() => {
    // Force-login when the silent refresh fails (expired refresh token).
    // Avoid re-pushing /login when already there, otherwise a 401 storm on the
    // login page turns into an infinite refresh->logout->redirect loop.
    setUnauthorizedHandler(() => {
      void logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        router.push('/login');
      }
    });
  }, [logout, router]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <SessionManager />
        <Toaster richColors position="top-center" closeButton />
        <HydrationGate>{children}</HydrationGate>
      </ThemeProvider>
    </QueryProvider>
  );
}