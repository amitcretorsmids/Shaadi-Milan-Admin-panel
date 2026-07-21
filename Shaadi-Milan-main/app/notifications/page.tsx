'use client';
import { useState, useMemo } from 'react';
import { useDashboardCounts, useSendNotification, useAllNotifications } from '@/hooks/use-queries';
import { Card, CardHeader, Button, Table, Tr, Td, Skeleton, Badge, Select } from '@/components/ui';

const TARGETS = ['Male', 'Female', 'Agent', 'All'] as const;
type TargetType = typeof TARGETS[number];

const TARGET_ICONS: Record<TargetType, string> = { 
  Male: '👨', 
  Female: '👩', 
  Agent: '🤝', 
  All: '📢' 
};

const TARGET_COLORS: Record<TargetType, string> = {
  Male: 'border-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.1)] text-[#93c5fd]',
  Female: 'border-[rgba(232,86,138,0.4)] bg-[rgba(232,86,138,0.1)] text-[#ff7eb3]',
  Agent: 'border-[rgba(0,201,167,0.4)] bg-[rgba(0,201,167,0.1)] text-[#00c9a7]',
  All: 'border-[rgba(124,92,252,0.4)] bg-[rgba(124,92,252,0.1)] text-[#a78bfa]',
};

// Helper function to safely format date
const formatDate = (date: any): string => {
  if (!date) return 'N/A';
  
  // Handle Firestore Timestamp
  if (date && typeof date.toDate === 'function') {
    return date.toDate().toLocaleString();
  }
  
  // Handle Date object
  if (date instanceof Date) {
    return date.toLocaleString();
  }
  
  // Handle string
  if (typeof date === 'string') {
    return new Date(date).toLocaleString();
  }
  
  // Handle timestamp in seconds
  if (typeof date === 'number') {
    return new Date(date).toLocaleString();
  }
  
  // Handle Firestore Timestamp with seconds/nanoseconds
  if (date.seconds) {
    return new Date(date.seconds * 1000).toLocaleString();
  }
  
  return 'Invalid date';
};

// Helper function to safely get number
const getNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value) || 0;
  if (value && typeof value === 'object') return 0;
  return 0;
};

export default function NotificationsPage() {
  const [target, setTarget] = useState<TargetType>('Male');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [targetFilter, setTargetFilter] = useState('All');
  
  const { data: dashboardCounts, isLoading: countsLoading } = useDashboardCounts();
  const { data: notificationsData, isLoading, fetchNextPage, hasNextPage } = useAllNotifications({
    target: targetFilter === 'All' ? undefined : targetFilter,
  });
  const { mutate: sendNotif, isPending } = useSendNotification();

  const allNotifications = notificationsData?.pages.flatMap(page => page.notifications) ?? [];

  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;
    sendNotif({ target, title, message }, {
      onSuccess: () => {
        setSent(true);
        setTitle('');
        setMessage('');
        setTimeout(() => setSent(false), 3000);
      },
    });
  };

  const TARGET_COUNTS = useMemo(() => ({
    Male: dashboardCounts?.totalMale ?? 0,
    Female: dashboardCounts?.totalFemale ?? 0,
    Agent: dashboardCounts?.totalAgents ?? 0,
    All: dashboardCounts?.totalUsers ?? 0,
  }), [dashboardCounts]);

  // Calculate real stats from actual notifications
  const today = new Date().toISOString().split('T')[0];
  const sentToday = allNotifications.filter(n => {
    const notifDate = formatDate(n.sentAt || n.createdAt).split(',')[0];
    return notifDate === today;
  }).length;

  const totalSent = allNotifications.length;
  const avgReach = totalSent > 0 
    ? Math.round(allNotifications.reduce((acc, n) => acc + getNumber(n.sentTo), 0) / totalSent)
    : 0;

  return (
    <div className="space-y-6">
      {/* Target selector stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {TARGETS.map((t) => (
          <button
            key={t}
            onClick={() => setTarget(t)}
            className={`p-4 rounded-2xl border-2 transition-all text-left ${
              target === t
                ? TARGET_COLORS[t]
                : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--border-light)]"
            }`}
          >
            <div className="text-2xl mb-2">{TARGET_ICONS[t]}</div>
            <div className="font-display text-xl font-semibold text-[var(--text)]">
              {countsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                TARGET_COUNTS[t].toLocaleString()
              )}
            </div>
            <div className="text-[10px] uppercase tracking-wider mt-0.5">
              {t} Users
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Compose panel */}
        <Card>
          <CardHeader
            title={`Send to ${target} Users`}
            subtitle={`Will reach ${TARGET_COUNTS[target].toLocaleString()} users`}
          />
          <div className="p-5 space-y-4">
            {/* Target tabs */}
            <div className="flex gap-1 bg-[var(--bg-surface)] rounded-xl p-1">
              {TARGETS.map(t => (
                <button 
                  key={t} 
                  onClick={() => setTarget(t)}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
                    target === t 
                      ? 'bg-[rgba(124,92,252,0.3)] text-[var(--text)] border border-[rgba(124,92,252,0.4)]' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {TARGET_ICONS[t]} {t}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">
                Notification Title
              </label>
              <input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Enter notification title..."
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] placeholder-[var(--text-dim)] text-xs font-[inherit] outline-none focus:border-[var(--purple)] transition-colors" 
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">
                Message
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={`Write your message to ${target} users...`}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] placeholder-[var(--text-dim)] text-xs font-[inherit] outline-none focus:border-[var(--purple)] transition-colors resize-none"
              />
              <div className="text-[10px] text-[var(--text-dim)] mt-1 text-right">
                {message.length}/500 chars
              </div>
            </div>

            {sent && (
              <div className="bg-[rgba(0,201,167,0.1)] border border-[rgba(0,201,167,0.3)] rounded-xl px-4 py-2.5 text-[11px] text-[#00c9a7]">
                ✅ Notification sent successfully to {TARGET_COUNTS[target].toLocaleString()} {target} users!
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                className="flex-1" 
                onClick={() => { setTitle(''); setMessage(''); }}
              >
                Clear
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                loading={isPending}
                disabled={!title.trim() || !message.trim()}
                onClick={handleSend}
              >
                Send Notification ↗
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick stats */}
        <Card>
          <CardHeader 
            title="Delivery Stats" 
            subtitle="Notification performance overview" 
          />
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Sent Today', value: sentToday, icon: '📤', color: 'text-[#ffc84a]' },
                { label: 'Total Sent', value: totalSent, icon: '📨', color: 'text-[#93c5fd]' },
                { label: 'Avg Reach', value: avgReach, icon: '📊', color: 'text-[#00c9a7]' },
                { label: 'Delivery Rate', value: '98.4%', icon: '✅', color: 'text-[#a78bfa]' },
              ].map((s, i) => (
                <div key={i} className="bg-[var(--bg-surface)] rounded-xl p-3">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className={`font-display text-xl font-semibold ${s.color}`}>
                    {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
                  </div>
                  <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
            
            {/* Recent list */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-2">
                Recent Notifications
              </div>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)
              ) : (
                allNotifications.slice(0, 4).map((n, i) => (
                  <div key={n.id || i} className="flex items-center gap-3 py-2 border-b border-[rgba(46,42,74,0.4)] last:border-0">
                    <span className="text-base">{TARGET_ICONS[n.target as TargetType]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[var(--text)] truncate">{n.title}</div>
                      <div className="text-[10px] text-[var(--text-dim)]">
                        {formatDate(n.sentAt || n.createdAt)} · {getNumber(n.sentTo).toLocaleString()} users
                      </div>
                    </div>
                    <Badge variant="success">✓</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Full history table */}
      <Card>
        <CardHeader 
          title="Notification History" 
          subtitle="All sent notifications" 
          action={
            <Select value={targetFilter} onChange={e => setTargetFilter(e.target.value)}>
              <option value="All">All Targets</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Agent">Agent</option>
              <option value="All Users">All Users</option>
            </Select>
          }
        />
        {isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (
          <>
            <Table headers={['Target', 'Title', 'Message', 'Sent To', 'Date', 'Status']}>
              {allNotifications.map((n, i) => (
                <tr key={n.id || i} className="border-b border-[var(--border)] hover:bg-[var(--bg-surface)] transition-colors">
                  <Td>
                    <Badge 
                      variant={
                        n.target === 'Male' ? 'male' : 
                        n.target === 'Female' ? 'female' : 
                        n.target === 'Agent' ? 'agent' : 
                        'info'
                      }
                    >
                      {TARGET_ICONS[n.target as TargetType]} {n.target}
                    </Badge>
                  </Td>
                  <Td className="font-medium text-[var(--text)] text-xs">{n.title}</Td>
                  <Td className="max-w-[260px] truncate">{n.message}</Td>
                  <Td>{getNumber(n.sentTo).toLocaleString()} users</Td>
                  <Td>{formatDate(n.sentAt || n.createdAt)}</Td>
                  <Td><Badge variant="success">{n.status || 'Delivered'}</Badge></Td>
                </tr>
              ))}
            </Table>
            
            {hasNextPage && (
              <div className="p-4 text-center">
                <Button variant="primary" onClick={() => fetchNextPage()}>
                  Load More
                </Button>
              </div>
            )}
            
            {allNotifications.length === 0 && (
              <div className="p-8 text-center text-[var(--text-muted)]">
                No notifications sent yet. Create your first notification above!
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}