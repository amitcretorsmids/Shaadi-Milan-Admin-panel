'use client';
import { useRouter } from 'next/navigation';
import { useUsersWithProfiles } from '@/hooks/use-queries';
import { Card, CardHeader, Skeleton, Badge, Avatar } from '@/components/ui';

// ─── Helper: safely extract a string from Firebase fields that may be objects ──
function getString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.en === 'string') return obj.en;
    if (typeof obj.hi === 'string') return obj.hi;
    const firstStr = Object.values(obj).find(v => typeof v === 'string');
    if (firstStr) return firstStr as string;
  }
  return fallback;
}

export default function ProfilesPage() {
  const router = useRouter();
  const { data: usersWithProfiles, isLoading } = useUsersWithProfiles();

  return (
    <div className="space-y-4">
      <Card className="flex flex-col">
        <CardHeader title="Profile Management" subtitle="Click a user to edit their profile" />
        <div className="flex-1">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : (usersWithProfiles || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] gap-3">
              <span className="text-5xl">👤</span>
              <p className="text-sm">No profiles found</p>
            </div>
          ) : (
            (usersWithProfiles || []).map((u: any) => (
              <button
                key={u.uid}
                onClick={() => router.push(`/profiles/${u.uid}`)}
                className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-2 border-transparent hover:bg-[var(--bg-glass)] hover:border-[var(--purple)]"
              >
                <Avatar
                  name={getString(u.fullName)}
                  size="sm"
                  gender={getString(u.gender)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text)] truncate">{getString(u.fullName) || '—'}</div>
                  <div className="text-[10px] font-mono text-[var(--text-dim)]">{u.uid}</div>
                  {u.profile?.profileStatus && (
                    <Badge variant={u.profile.profileStatus === 'active' ? 'success' : 'warning'}>
                      {getString(u.profile.profileStatus)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getString(u.gender).toLowerCase() === 'male' ? 'male' : 'female'}>
                    {getString(u.gender).toLowerCase() === 'male' ? 'M' : 'F'}
                  </Badge>
                  <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}