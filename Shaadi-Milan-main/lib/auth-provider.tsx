'use client';
import { useEffect } from 'react';
import { useAuthStore } from './auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuthState } = useAuthStore();

  useEffect(() => {
    const unsubscribe = checkAuthState();
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [checkAuthState]);

  return <>{children}</>;
}