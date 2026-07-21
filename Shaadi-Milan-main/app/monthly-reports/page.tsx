'use client';
import { useState } from 'react';
import { useMonthlyData } from '@/hooks/use-queries';
import { StatCard, Card, CardHeader, FilterBar, Button, Table, Tr, Td, Skeleton, Badge } from '@/components/ui';
import { RegistrationBarChart, FixedAreaChart, RevenueBarChart } from '@/components/charts';

export default function MonthlyReportsPage() {
  const [period, setPeriod] = useState('Monthly');
  const { data, isLoading } = useMonthlyData(period);

  const months = data || [];
  const totals = months.reduce(
    (acc, m) => ({
      male: acc.male + m.male,
      female: acc.female + m.female,
      agent: acc.agent + m.agent,
      maleFixed: acc.maleFixed + m.maleFixed,
      femaleFixed: acc.femaleFixed + m.femaleFixed,
      marriages: acc.marriages + m.marriages,
      revenue: acc.revenue + m.revenue,
    }),
    { male: 0, female: 0, agent: 0, maleFixed: 0, femaleFixed: 0, marriages: 0, revenue: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <FilterBar value={period} onChange={setPeriod} />
        <Button variant="primary">Export Report ↓</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)
          : <>
            <StatCard label="Fixed Male" value={totals.maleFixed} icon="💍" color="blue" delta={8} />
            <StatCard label="Fixed Female" value={totals.femaleFixed} icon="💐" color="pink" delta={6} />
            <StatCard label="Male Registrations" value={totals.male} icon="👨" color="gold" delta={11} />
            <StatCard label="Female Registrations" value={totals.female} icon="👩" color="purple" delta={9} />
            <StatCard label="Agent Registrations" value={totals.agent} icon="🤝" color="teal" delta={4} />
            <StatCard label="Total Marriages" value={totals.marriages} icon="🎊" color="red" delta={18} />
          </>}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Monthly Registration Overview" subtitle="Male, Female & Agent by month" />
          <div className="p-5">
            {isLoading ? <Skeleton className="h-56" /> : <RegistrationBarChart data={months} />}
          </div>
        </Card>
        <Card>
          <CardHeader title="Fixed Relationships" subtitle="Male vs Female" />
          <div className="p-5">
            {isLoading ? <Skeleton className="h-56" /> : <FixedAreaChart data={months} />}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Revenue by Month" subtitle="Monthly revenue trend" />
        <div className="p-5">
          {isLoading ? <Skeleton className="h-48" /> : <RevenueBarChart data={months} />}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader
          title="Monthly Breakdown Table"
          subtitle="Complete month-by-month data"
          action={<Button variant="primary" size="sm">Export CSV</Button>}
        />
        {isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
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
      </Card>
    </div>
  );
}
