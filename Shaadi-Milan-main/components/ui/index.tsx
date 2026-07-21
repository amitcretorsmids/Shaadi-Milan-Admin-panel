'use client';
import React from 'react';

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'male' | 'female' | 'agent' | 'neutral';
const BADGE_STYLES: Record<BadgeVariant, string> = {
  success: 'bg-[rgba(0,201,167,0.15)] text-[#00c9a7]',
  warning: 'bg-[rgba(245,166,35,0.15)] text-[#ffc84a]',
  danger: 'bg-[rgba(232,86,106,0.15)] text-[#ff8fa3]',
  info: 'bg-[rgba(124,92,252,0.2)] text-[#a78bfa]',
  male: 'bg-[rgba(59,130,246,0.15)] text-[#93c5fd]',
  female: 'bg-[rgba(232,86,138,0.15)] text-[#ff7eb3]',
  agent: 'bg-[rgba(0,201,167,0.15)] text-[#00c9a7]',
  neutral: 'bg-[rgba(255,255,255,0.07)] text-[#9b97c0]',
};
export function Badge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${BADGE_STYLES[variant]}`}>
      {children}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
type AccentColor = 'gold' | 'pink' | 'teal' | 'purple' | 'blue' | 'red';
const ACCENT_TOP: Record<AccentColor, string> = {
  gold: 'from-[#f5a623] to-[#ffc84a]',
  pink: 'from-[#e8568a] to-[#ff7eb3]',
  teal: 'from-[#00c9a7] to-[#00ffcc]',
  purple: 'from-[#7c5cfc] to-[#a78bfa]',
  blue: 'from-[#3b82f6] to-[#93c5fd]',
  red: 'from-[#e8556a] to-[#ff8fa3]',
};
const ACCENT_ICON_BG: Record<AccentColor, string> = {
  gold: 'bg-[rgba(245,166,35,0.15)]',
  pink: 'bg-[rgba(232,86,138,0.15)]',
  teal: 'bg-[rgba(0,201,167,0.15)]',
  purple: 'bg-[rgba(124,92,252,0.15)]',
  blue: 'bg-[rgba(59,130,246,0.15)]',
  red: 'bg-[rgba(232,85,106,0.15)]',
};
const ACCENT_VAL: Record<AccentColor, string> = {
  gold: 'text-[#ffc84a]', pink: 'text-[#ff7eb3]', teal: 'text-[#00c9a7]',
  purple: 'text-[#a78bfa]', blue: 'text-[#93c5fd]', red: 'text-[#ff8fa3]',
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: AccentColor;
  delta?: number;
  loading?: boolean;
}
export function StatCard({ label, value, icon, color, delta, loading }: StatCardProps) {
  if (loading) return <div className="shimmer rounded-2xl h-32" />;
  return (
    <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-light)]">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${ACCENT_TOP[color]}`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-lg ${ACCENT_ICON_BG[color]}`}>{icon}</div>
      <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-3xl font-semibold font-display mb-1 ${ACCENT_VAL[color]}`}>{value}</div>
      {delta !== undefined && (
        <div className={`text-[11px] ${delta >= 0 ? 'text-[#00c9a7]' : 'text-[#ff8fa3]'}`}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% vs last period
        </div>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl ${className}`}>
      {children}
    </div>
  );
}
export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
        {subtitle && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />;
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md';
  loading?: boolean;
}
const BTN_STYLES = {
  primary: 'border border-[rgba(245,166,35,0.3)] bg-[rgba(245,166,35,0.12)] text-[#ffc84a] hover:bg-[rgba(245,166,35,0.2)]',
  ghost: 'border border-[var(--border-light)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-glass)] hover:text-[var(--text)]',
  danger: 'border border-[rgba(232,86,106,0.3)] bg-[rgba(232,86,106,0.1)] text-[#ff8fa3] hover:bg-[rgba(232,86,106,0.2)]',
  success: 'border border-[rgba(0,201,167,0.3)] bg-[rgba(0,201,167,0.1)] text-[#00c9a7] hover:bg-[rgba(0,201,167,0.2)]',
};
const BTN_SIZE = { sm: 'px-3 py-1.5 text-[11px]', md: 'px-4 py-2 text-xs' };

export function Button({ variant = 'ghost', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={` cursor-pointer  inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${BTN_STYLES[variant]} ${BTN_SIZE[size]} ${className}`}
    >
      {loading ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : null}
      {children}
    </button>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
export function FilterBar({
  value,
  onChange,
  options = ['Weekly', 'Monthly', 'Custom'],
}: {
  value: string;
  onChange: (v: string) => void;
  options?: string[];
}) {
  return (
    <div className="flex gap-1 bg-[var(--bg-surface)] rounded-lg p-0.5">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
            value === opt
              ? 'bg-[rgba(124,92,252,0.3)] text-[var(--text)] border border-[rgba(124,92,252,0.4)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Input / Select ───────────────────────────────────────────────────────────
export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder-[var(--text-dim)] text-xs font-[inherit] outline-none focus:border-[var(--purple)] transition-colors ${className}`}
    />
  );
}

export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] text-xs font-[inherit] outline-none focus:border-[var(--purple)] transition-colors ${className}`}
    >
      {children}
    </select>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  filter,
  onFilterChange,
  action,
}: {
  title: string;
  subtitle?: string;
  filter?: string;
  onFilterChange?: (v: string) => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold font-display text-[#ffc84a]">{title}</h1>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {filter && onFilterChange && <FilterBar value={filter} onChange={onFilterChange} />}
        {action}
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-semibold bg-[var(--bg-surface)] border-b border-[var(--border)] first:rounded-tl-none last:rounded-tr-none">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`border-b border-[rgba(46,42,74,0.5)] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-xs text-[var(--text-muted)] ${className}`}>{children}</td>;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = 'teal' }: { value: number; color?: 'teal' | 'pink' | 'gold' | 'purple' }) {
  const colors = {
    teal: 'from-[#00c9a7] to-[#00ffcc]',
    pink: 'from-[#e8568a] to-[#ff7eb3]',
    gold: 'from-[#f5a623] to-[#ffc84a]',
    purple: 'from-[#7c5cfc] to-[#a78bfa]',
  };
  return (
    <div className="h-1 bg-[var(--bg-surface)] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colors[color]} transition-all duration-500`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({
  name,
  size = 'md',
  gender,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  gender?: string;
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const genderKey = gender?.toLowerCase();

  const bg =
    genderKey === 'female'
      ? 'from-rose-500 to-pink-500'
      : genderKey === 'male'
      ? 'from-blue-600 to-sky-400'
      : 'from-slate-600 to-slate-400';

  const sizes = {
    sm: 'w-8 h-8 text-xs rounded-lg',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-14 h-14 text-lg rounded-2xl',
  };

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center font-semibold text-white shadow-md bg-gradient-to-br ${bg} ${sizes[size]}`}
    >
      {initials}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Toast-like notification pill ────────────────────────────────────────────
export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Active: 'bg-[#00c9a7]', Verified: 'bg-[#7c5cfc]',
    Pending: 'bg-[#f5a623]', Suspended: 'bg-[#e8556a]', Inactive: 'bg-[#5c5880]',
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${colors[status] || 'bg-gray-500'}`} />
      <span className="text-xs text-[var(--text-muted)]">{status}</span>
    </span>
  );
}

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] placeholder-[var(--text-dim)] text-xs font-[inherit] outline-none focus:border-[var(--purple)] transition-colors resize-y min-h-[80px] ${className}`}
    />
  );
}
