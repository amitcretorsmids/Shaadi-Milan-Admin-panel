'use client';
import AdminGuard from '@/components/layout/AdminGuard';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
