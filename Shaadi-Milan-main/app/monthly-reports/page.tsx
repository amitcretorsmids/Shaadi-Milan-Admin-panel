'use client';
import { useState } from 'react';
import { useMonthlyData, useRegistrationChartData, useFixedChartData } from '@/hooks/use-queries';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  StatCard, Card, CardHeader, FilterBar, Button,
  Table, Tr, Td, Skeleton, Badge
} from '@/components/ui';
import { RegistrationBarChart, FixedAreaChart, RevenueBarChart } from '@/components/charts';

// ─── Period type ─────────────────────────────────────────────────────────────
type Period = 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

export default function MonthlyReportsPage() {
  const [period, setPeriod] = useState<Period>('Monthly');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const customFromDate = customFrom ? new Date(customFrom) : null;
  const customToDate   = customTo   ? new Date(customTo)   : null;

  // ── Real Firestore stats → 6 stat cards ───────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useMonthlyData(
    period, customFromDate, customToDate
  );

  // ── Real Firestore data → Registration Bar Chart ───────────────────────────
  const { data: chartData = [], isLoading: chartLoading } = useRegistrationChartData(
    period, customFromDate, customToDate
  );

  // ── Real Firestore data → Fixed Relationships Area Chart ───────────────────
  const { data: fixedChartData = [], isLoading: fixedChartLoading } = useFixedChartData(
    period, customFromDate, customToDate
  );

  // ── Mock MonthlyData[] → FixedAreaChart + RevenueBarChart + Table ──────────
  const { data: months = [], isLoading: mockLoading } = useQuery({
    queryKey: ['monthly-chart-data', period],
    queryFn: () => api.getMonthlyData(period),
    staleTime: 1000 * 60 * 10,
  });

  const totals = months.reduce(
    (acc, m) => ({
      male:        acc.male        + m.male,
      female:      acc.female      + m.female,
      agent:       acc.agent       + m.agent,
      maleFixed:   acc.maleFixed   + m.maleFixed,
      femaleFixed: acc.femaleFixed + m.femaleFixed,
      marriages:   acc.marriages   + m.marriages,
      revenue:     acc.revenue     + m.revenue,
    }),
    { male: 0, female: 0, agent: 0, maleFixed: 0, femaleFixed: 0, marriages: 0, revenue: 0 }
  );

  const handlePeriodChange = (p: string) => {
    setPeriod(p as Period);
    if (p !== 'Custom') {
      setCustomFrom('');
      setCustomTo('');
    }
  };

  return (
    <div className="space-y-6">

      {/* ── FilterBar + Export ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <FilterBar value={period} onChange={handlePeriodChange} />
        <Button variant="primary">Export Report ↓</Button>
      </div>

      {/* ── Custom date pickers ─────────────────────────────────────────────── */}
      {period === 'Custom' && (
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
          background: 'var(--bg-surface)', borderRadius: '12px', padding: '14px 18px',
          border: '1px solid rgba(124,92,252,0.25)',
        }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>From:</label>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', color: 'var(--text)', fontSize: '13px' }} />
          <label style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>To:</label>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', color: 'var(--text)', fontSize: '13px' }} />
          {(!customFrom || !customTo) && (
            <span style={{ color: '#f59e0b', fontSize: '12px' }}>⚠️ Select both dates to load data</span>
          )}
        </div>
      )}

      {/* ── 6 Real Stat Cards (live Firebase data) ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard label="Fixed Male"           value={stats?.fixedMale          ?? 0} icon="💍" color="blue"   delta={8}  />
            <StatCard label="Fixed Female"         value={stats?.fixedFemale        ?? 0} icon="💐" color="pink"   delta={6}  />
            <StatCard label="Male Registrations"   value={stats?.maleRegistrations  ?? 0} icon="👨" color="gold"   delta={11} />
            <StatCard label="Female Registrations" value={stats?.femaleRegistrations ?? 0} icon="👩" color="purple" delta={9}  />
            <StatCard label="Agent Registrations"  value={stats?.agentRegistrations ?? 0} icon="🤝" color="teal"   delta={4}  />
            <StatCard label="Total Marriages"      value={stats?.totalMarriages     ?? 0} icon="🎊" color="red"    delta={18} />
          </>
        )}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* ✅ REAL data from Firebase */}
        <Card>
          <CardHeader
            title="Monthly Registration Overview"
            subtitle={
              period === 'Daily'   ? 'Hour-by-hour today' :
              period === 'Weekly'  ? 'Last 7 days (by day)' :
              period === 'Monthly' ? 'Month-by-month (current year)' :
              'Custom range (by day)'
            }
          />
          <div className="p-5">
            {chartLoading
              ? <Skeleton className="h-56" />
              : <RegistrationBarChart data={chartData} />}
          </div>
        </Card>

        {/* Fixed relationships chart (Real data) */}
        <Card>
          <CardHeader title="Fixed Relationships" subtitle="Male vs Female" />
          <div className="p-5">
            {fixedChartLoading ? <Skeleton className="h-56" /> : <FixedAreaChart data={fixedChartData} />}
          </div>
        </Card>
      </div>

      {/* <Card>
        <CardHeader title="Revenue by Month" subtitle="Monthly revenue trend" />
        <div className="p-5">
          {mockLoading ? <Skeleton className="h-48" /> : <RevenueBarChart data={months} />}
        </div>
      </Card> */}

      {/* ── Original Monthly Breakdown Table ───────────────────────────────── */}
      {/* <Card>
        <CardHeader
          title="Monthly Breakdown Table"
          subtitle="Complete month-by-month data"
          action={<Button variant="primary" size="sm">Export CSV</Button>}
        />
        {mockLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (
          <Table headers={['Month', 'Male Reg', 'Female Reg', 'Agent Reg', 'Total Reg', 'Male Fixed', 'Female Fixed', 'Marriages', 'Revenue']}>
            {months.map((m, i) => (
              <Tr key={i}>
                <Td className="font-semibold text-[var(--text)]">{m.month}</Td>
                <Td><Badge variant="male">{m.male}</Badge></Td>
                <Td><Badge variant="female">{m.female}</Badge></Td>
                <Td><Badge variant="agent">{m.agent}</Badge></Td>
                <Td className="font-medium text-[var(--text)]">{m.male + m.female + m.agent}</Td>
                <Td>{m.maleFixed}</Td>
                <Td>{m.femaleFixed}</Td>
                <Td><Badge variant="success">{m.marriages}</Badge></Td>
                <Td className="text-[#ffc84a] font-medium">₹{m.revenue.toLocaleString()}</Td>
              </Tr>
            ))}
            <Tr className="bg-[rgba(124,92,252,0.05)]">
              <Td className="font-bold text-[#a78bfa]">TOTAL</Td>
              <Td className="font-bold text-[var(--text)]">{totals.male}</Td>
              <Td className="font-bold text-[var(--text)]">{totals.female}</Td>
              <Td className="font-bold text-[var(--text)]">{totals.agent}</Td>
              <Td className="font-bold text-[var(--text)]">{totals.male + totals.female + totals.agent}</Td>
              <Td className="font-bold text-[var(--text)]">{totals.maleFixed}</Td>
              <Td className="font-bold text-[var(--text)]">{totals.femaleFixed}</Td>
              <Td className="font-bold text-[var(--text)]">{totals.marriages}</Td>
              <Td className="font-bold text-[#ffc84a]">₹{totals.revenue.toLocaleString()}</Td>
            </Tr>
          </Table>
        )}
      </Card> */}

    </div>
  );
}
