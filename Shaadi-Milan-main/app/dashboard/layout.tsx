'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <div className="w-8 h-8 border-2 border-[#7c5cfc] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
