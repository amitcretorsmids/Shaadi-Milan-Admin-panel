'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function RootPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
      <div className="w-8 h-8 border-2 border-[#7c5cfc] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
