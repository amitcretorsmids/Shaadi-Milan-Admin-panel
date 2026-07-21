'use client';
import { useState } from 'react';
import { useWeeklyData, useAgents } from '@/hooks/use-queries';
import { StatCard, Card, CardHeader, FilterBar, Button, Table, Tr, Td, Skeleton, Badge } from '@/components/ui';
import { WeeklyLineChart } from '@/components/charts';

export default function WeeklyReportsPage() {
  const [period, setPeriod] = useState('Weekly');
  const { data: weekly, isLoading } = useWeeklyData();
  const { data: agents } = useAgents();

  const latest = weekly?.[weekly.length - 1];
  const prev = weekly?.[weekly.length - 2];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <FilterBar value={period} onChange={setPeriod} />
        <Button variant="primary">Export ↓</Button>
      </div>

      {/* Key weekly stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard label="This Week Reg." value={latest?.registrations ?? 0} icon="📥" color="teal"
              delta={prev ? Math.round(((latest!.registrations - prev.registrations) / prev.registrations) * 100) : 0} />
            <StatCard label="Last Week Reg." value={prev?.registrations ?? 0} icon="📤" color="gold" />
            <StatCard label="This Week Fixed" value={latest?.fixed ?? 0} icon="💞" color="purple"
              delta={prev ? Math.round(((latest!.fixed - prev.fixed) / prev.fixed) * 100) : 0} />
            <StatCard label="Last Week Fixed" value={prev?.fixed ?? 0} icon="💫" color="pink" />
          </>
        )}
      </div>

      {/* Line chart */}
      <Card>
        <CardHeader title="Week-by-Week Comparison" subtitle="Registrations & fixed relationships per week" />
        <div className="p-5">
          {isLoading ? <Skeleton className="h-56" /> : <WeeklyLineChart data={weekly!} />}
        </div>
      </Card>

      {/* Weekly breakdown table */}
      <Card>
        <CardHeader title="Weekly Data Table" subtitle="All weeks this period" action={<Button variant="ghost" size="sm">Export</Button>} />
        {isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : (
          <Table headers={['Week', 'Registrations', 'Fixed', 'Revenue', 'Avg. per Day', 'Trend']}>
            {(weekly ?? []).map((w, i) => {
              const prev = weekly![i - 1];
              const trend = prev ? (w.registrations >= prev.registrations ? '↑' : '↓') : '—';
              const trendColor = trend === '↑' ? 'text-[#00c9a7]' : trend === '↓' ? 'text-[#ff8fa3]' : 'text-[var(--text-dim)]';
              return (
                <Tr key={i}>
                  <Td className="font-semibold text-[var(--text)]">{w.week}</Td>
                  <Td><Badge variant="info">{w.registrations}</Badge></Td>
                  <Td><Badge variant="success">{w.fixed}</Badge></Td>
                  <Td className="text-[#ffc84a] font-medium">₹{w.revenue.toLocaleString()}</Td>
                  <Td>{Math.round(w.registrations / 7)}/day</Td>
                  <Td className={`font-bold text-lg ${trendColor}`}>{trend}</Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </Card>

      {/* Agent payout table */}
      <Card>
        <CardHeader
          title="Weekly Agent Payout Summary"
          subtitle="Critical for calculating agent commissions"
          action={<Button variant="primary" size="sm">Process Payments</Button>}
        />
        {!agents ? (
          <div className="p-5 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : (
          <Table headers={['Agent ID', 'Name', 'This Week Reg', 'Last Week Reg', 'Fixed', 'Payout (₹)', 'Status']}>
            {agents.slice(0, 6).map((a, i) => (
              <Tr key={i}>
                <Td className="font-mono text-[11px] text-[var(--text-dim)]">{a.id}</Td>
                <Td className="font-semibold text-[var(--text)]">{a.name}</Td>
                <Td>{a.thisWeekReg}</Td>
                <Td>{a.lastWeekReg}</Td>
                <Td>{a.thisWeekFixed}</Td>
                <Td className="font-semibold text-[#ffc84a]">₹{((a.thisWeekReg * 150) + (a.thisWeekFixed * 500)).toLocaleString()}</Td>
                <Td><Badge variant={i % 2 === 0 ? 'success' : 'warning'}>{i % 2 === 0 ? 'Processed' : 'Pending'}</Badge></Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
