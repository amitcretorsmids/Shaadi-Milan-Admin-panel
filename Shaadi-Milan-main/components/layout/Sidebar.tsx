'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { href: '/monthly-reports', label: 'Monthly Reports', icon: '📅' },
      { href: '/agent-performance', label: 'Agent Performance', icon: '🏆' },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/users', label: 'User Management', icon: '👥' },
      // { href: '/approvals', label: 'Registration Control', icon: '✅', badge: 4 },
      { href: '/profiles', label: 'Profile Management', icon: '✏️' },
      { href: '/agent-management', label: 'Agent Management', icon: '🤝' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/orders', label: 'Orders & Payments', icon: '💳' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/notifications', label: 'Notifications', icon: '🔔' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
  // {
  //   label: 'Youtube Section',
  //   items: [
  //     { href: '/youtube', label: 'Youtube', icon: '📺' },
  //   ],
  // },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside
      className="flex flex-col flex-shrink-0 border-r border-[var(--border)] overflow-y-auto"
      style={{ width: 'var(--sidebar-w)', background: 'var(--bg-card)' }}
    >
      {/* Brand */}
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          {/* Logo Image */}
          <img
            src="/shaadi-milan-logo.png"
            alt="Shaadi Milan Logo"
            className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
            style={{ background: 'rgba(255,200,74,0.08)', padding: '2px' }}
          />
          <div>
            <div className="font-display text-[13px] font-semibold text-[#ffc84a] leading-tight">
              Shaadi Milan
            </div>
            <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-[2px] mt-0.5">
              Admin Panel
            </div>
          </div>
        </div>
      </div>


      {/* Nav */}
      <nav className="flex-1 py-2">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <div className="px-4 pt-4 pb-1 text-[9px] font-semibold uppercase tracking-[2px] text-[var(--text-dim)]">
              {section.label}
            </div>
            {section.items.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 mx-2 px-3 py-2 rounded-lg text-[13px] font-normal transition-all duration-200 mb-0.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-[rgba(124,92,252,0.25)] to-[rgba(232,86,138,0.15)] text-[var(--text)] border border-[rgba(124,92,252,0.3)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-glass)] hover:text-[var(--text)]'
                  }`}
                >
                  <span className="text-sm opacity-75">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {/* {'badge' in item && item.badge && (
                    <span className="bg-[var(--danger)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )} */}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)] cursor-pointer">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-glass)] border border-[var(--border)]">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #e8568a)' }}
          >
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'SA'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[var(--text)] truncate">{user?.name || 'Admin'}</div>
            <div className="text-[10px] text-[var(--text-muted)] capitalize">{user?.role || 'admin'}</div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="text-[var(--text-dim)] hover:text-[var(--danger)] transition-colors text-sm cursor-pointer"
          >
            ⇥
          </button>
        </div>
      </div>
    </aside>
  );
}
