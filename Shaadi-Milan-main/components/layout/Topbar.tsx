'use client';
import { usePathname } from 'next/navigation';
import { FilterBar, Button } from '@/components/ui';
import { useState } from 'react';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview & summary reports' },
  '/monthly-reports': { title: 'Monthly Reports', subtitle: 'Detailed monthly analytics' },
  '/weekly-reports': { title: 'Weekly Reports', subtitle: 'Weekly tracking & agent payments' },
  '/agent-performance': { title: 'Agent Performance', subtitle: 'Pan India performance metrics' },
  '/users': { title: 'User Management', subtitle: 'Male, Female & Agent directory' },
  '/approvals': { title: 'Registration Control', subtitle: 'Approve, reject & verify registrations' },
  '/profiles': { title: 'Profile Management', subtitle: 'Edit any user profile with admin authority' },
  '/agent-management': { title: 'Agent Management', subtitle: 'Register agents & generate unique IDs' },
  '/orders': { title: 'Orders & Payments', subtitle: 'Transactions & revenue tracking' },
  '/notifications': { title: 'Notifications', subtitle: 'Targeted messaging system' },
  '/settings': { title: 'Settings', subtitle: 'System & security configuration' },
};

export function Topbar() {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] || { title: 'Admin', subtitle: '' };
  const [filter, setFilter] = useState('Monthly');
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0 border-b border-[var(--border)]"
      style={{ height: 'var(--topbar-h)', background: 'var(--bg-card)' }}
    >
      <div>
        <h2 className="text-xl font-semibold font-display text-[#ffc84a]">{meta.title}</h2>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* <FilterBar value={filter} onChange={setFilter} /> */}
        {/* <Button variant="primary" size="sm">
          Export ↓
        </Button> */}
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--border-light)] transition-colors text-base"
        >
          🔔
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--danger)] rounded-full" />
        </button>
        {showNotif && (
          <div
            className="absolute top-16 right-6 z-50 w-72 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl p-4"
            onClick={() => setShowNotif(false)}
          >
            <div className="text-xs font-semibold text-[var(--text)] mb-3">Recent Alerts</div>
            {[
              { msg: '4 registrations pending review', color: 'text-[#ffc84a]', icon: '⚠' },
              { msg: 'Weekly payout due tomorrow', color: 'text-[#ff7eb3]', icon: '💳' },
              { msg: 'New agent registered', color: 'text-[#00c9a7]', icon: '🤝' },
            ].map((n, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-sm">{n.icon}</span>
                <span className={`text-[11px] ${n.color}`}>{n.msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
