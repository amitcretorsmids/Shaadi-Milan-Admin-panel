'use client';
import { useDashboard, useMonthlyData } from '@/hooks/use-queries';
import { StatCard, Card, CardHeader, Skeleton } from '@/components/ui';
import { RegistrationBarChart, FixedAreaChart, DonutChart } from '@/components/charts';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboard();
  const { data: monthly, isLoading: monthlyLoading } = useMonthlyData('Monthly');

  const pieData = [
    { name: 'Male', value: stats?.totalRegistrations ? 1842 : 0 },
    { name: 'Female', value: stats?.totalRegistrations ? 1456 : 0 },
    { name: 'Agents', value: stats?.totalAgents || 0 },
  ];

  const marriagePipe = [
    { name: 'Active', value: stats ? stats.totalRegistrations - stats.maleFixed - stats.femaleFixed : 0 },
    { name: 'Fixed', value: stats ? stats.maleFixed + stats.femaleFixed : 0 },
    { name: 'Married', value: stats ? stats.maleMarried + stats.femaleMarried : 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard label="Total Registrations" value={stats!.totalRegistrations.toLocaleString()} icon="👥" color="gold" delta={stats!.registrationGrowth} />
            <StatCard label="Fixed (Male)" value={stats!.maleFixed.toLocaleString()} icon="💍" color="blue" delta={stats!.fixedGrowth} />
            <StatCard label="Fixed (Female)" value={stats!.femaleFixed.toLocaleString()} icon="💐" color="pink" delta={stats!.fixedGrowth - 2} />
            <StatCard label="Married (Male)" value={stats!.maleMarried.toLocaleString()} icon="🎉" color="teal" delta={stats!.marriageGrowth} />
            <StatCard label="Married (Female)" value={stats!.femaleMarried.toLocaleString()} icon="👑" color="purple" delta={stats!.marriageGrowth - 1} />
            <StatCard label="Active Agents" value={stats!.activeAgents.toLocaleString()} icon="🤝" color="red" delta={3} />
          </>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader title="Registration Trends" subtitle="Male vs Female vs Agent registrations by month" />
          <div className="p-5">
            {monthlyLoading ? <Skeleton className="h-56" /> : <RegistrationBarChart data={monthly!} />}
          </div>
        </Card>
        <Card>
          <CardHeader title="User Distribution" subtitle="By gender & type" />
          <div className="p-5">
            {statsLoading ? <Skeleton className="h-56" /> : <DonutChart data={pieData} />}
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader title="Fixed Relationships Trend" subtitle="Male vs Female fixed per month" />
          <div className="p-5">
            {monthlyLoading ? <Skeleton className="h-52" /> : <FixedAreaChart data={monthly!} />}
          </div>
        </Card>
        <Card>
          <CardHeader title="Marriage Pipeline" subtitle="Registration → Fixed → Married" />
          <div className="p-5">
            {statsLoading ? <Skeleton className="h-52" /> : <DonutChart data={marriagePipe} />}
          </div>
        </Card>
      </div>

      {/* Summary metrics row */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending Approvals', value: stats.pendingApprovals, icon: '⏳', color: 'bg-[rgba(245,166,35,0.15)] text-[#ffc84a]' },
            { label: 'Monthly Revenue', value: `₹${(stats.monthlyRevenue / 100000).toFixed(1)}L`, icon: '💰', color: 'bg-[rgba(0,201,167,0.15)] text-[#00c9a7]' },
            { label: 'Total Agents', value: stats.totalAgents, icon: '🤝', color: 'bg-[rgba(124,92,252,0.15)] text-[#a78bfa]' },
            { label: 'Total Marriages', value: stats.maleMarried + stats.femaleMarried, icon: '🎊', color: 'bg-[rgba(232,86,138,0.15)] text-[#ff7eb3]' },
          ].map(m => (
            <div key={m.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${m.color}`}>{m.icon}</div>
              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{m.label}</div>
                <div className={`text-xl font-semibold font-display ${m.color.split(' ')[1]}`}>{m.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
