'use client';
import { useState } from 'react';
import { useAgents } from '@/hooks/use-queries';
import { Card, CardHeader, FilterBar, Button, Table, Tr, Td, Skeleton, Badge, ProgressBar, Avatar } from '@/components/ui';
import { ConversionBarChart } from '@/components/charts';

export default function AgentPerformancePage() {
  const [period, setPeriod] = useState('Monthly');
  const { data: agents, isLoading } = useAgents();

  const chartData = (agents || []).map(a => ({
    name: (a.name || (a as any).agentName || 'Unknown').split(' ')[0],
    users: a.usersAdded || 0,
    paid: a.usersPaid || 0,
  }));

  const convColors: Array<'teal' | 'gold' | 'pink' | 'purple'> = ['teal', 'gold', 'pink', 'purple', 'teal', 'gold', 'pink', 'purple'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <FilterBar value={period} onChange={setPeriod} />
        <Button variant="primary">Export Report ↓</Button>
      </div>

      {/* Agent cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(agents || []).map((a, i) => (
            <div key={a.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--border-light)] hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={a.name || (a as any).agentName || 'Unknown'} size="md" />
                <div>
                  <div className="font-semibold text-sm text-[var(--text)]">{a.name || (a as any).agentName || 'Unknown'}</div>
                  <div className="text-[10px] font-mono text-[var(--text-dim)] mt-0.5">{a.id || (a as any).agentId}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{a.district || (a as any).agentCity || 'N/A'}, {a.state || (a as any).agentState || 'N/A'}</div>
                </div>
                <Badge variant={a.status === 'Active' ? 'success' : 'warning'} >{a.status || ((a as any).isApproved ? 'Active' : 'Pending')}</Badge>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">Conversion Rate</span>
                  <span className="text-xs font-semibold text-[var(--text)]">{a.conversionRate || 0}%</span>
                </div>
                <ProgressBar value={a.conversionRate || 0} color={convColors[i % 4]} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Users Added', value: a.usersAdded || 0, color: 'text-[#93c5fd]' },
                  { label: 'Paid Users', value: a.usersPaid || 0, color: 'text-[#00c9a7]' },
                  { label: 'Revenue', value: `₹${((a.totalRevenue || 0) / 1000).toFixed(0)}k`, color: 'text-[#ffc84a]' },
                ].map(s => (
                  <div key={s.label} className="bg-[var(--bg-surface)] rounded-xl p-2.5">
                    <div className={`text-lg font-semibold font-display ${s.color}`}>{s.value}</div>
                    <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-wide mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conversion chart */}
      <Card>
        <CardHeader title="Registration vs. Paid — All Agents" subtitle="Conversion funnel by agent" />
        <div className="p-5">
          {isLoading ? <Skeleton className="h-56" /> : <ConversionBarChart data={chartData} />}
        </div>
      </Card>

      {/* Full table */}
      <Card>
        <CardHeader
          title="District-wise Agent Table"
          subtitle="Pan India agent performance"
          action={<Button variant="primary" size="sm">Export CSV</Button>}
        />
        {isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : (
          <Table headers={['Agent ID', 'Name', 'State', 'District', 'Joined', 'Users', 'Paid', 'Conversion', 'Revenue', 'Status']}>
            {(agents || []).map((a, i) => (
              <Tr key={i}>
                <Td className="font-mono text-[11px] text-[#ffc84a]">{a.id}</Td>
                <Td className="font-semibold text-[var(--text)]">{a.name}</Td>
                <Td>{a.state}</Td>
                <Td>{a.district}</Td>
                <Td>{a.joinedAt}</Td>
                <Td>{a.usersAdded}</Td>
                <Td>{a.usersPaid}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={a.conversionRate} color={a.conversionRate >= 70 ? 'teal' : a.conversionRate >= 60 ? 'gold' : 'pink'} />
                    <span className="text-xs w-8 flex-shrink-0">{a.conversionRate}%</span>
                  </div>
                </Td>
                <Td className="text-[#ffc84a] font-medium">₹{a.totalRevenue.toLocaleString()}</Td>
                <Td><Badge variant={a.status === 'Active' ? 'success' : 'warning'}>{a.status}</Badge></Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
