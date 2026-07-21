'use client';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#1a1830',
    border: '1px solid #2e2a4a',
    borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: '#fffffe',
  },
  cursor: { fill: 'rgba(255,255,255,0.02)' },
};

const AXIS_PROPS = {
  tick: { fill: '#9b97c0', fontSize: 10 },
  axisLine: false as const,
  tickLine: false as const,
};

export function RegistrationBarChart({ data }: { data: Array<{ month: string; male: number; female: number; agent: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barGap={2} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#2e2a4a" vertical={false} />
        <XAxis dataKey="month" {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend iconType="circle" iconSize={8} />
        <Bar dataKey="male" name="Male" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="female" name="Female" fill="#e8568a" radius={[3, 3, 0, 0]} />
        <Bar dataKey="agent" name="Agent" fill="#00c9a7" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FixedAreaChart({ data }: { data: Array<{ month: string; maleFixed: number; femaleFixed: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e8568a" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#e8568a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e2a4a" vertical={false} />
        <XAxis dataKey="month" {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend iconType="circle" iconSize={8} />
        <Area type="monotone" dataKey="maleFixed" name="Male Fixed" stroke="#3b82f6" fill="url(#gm)" strokeWidth={2} />
        <Area type="monotone" dataKey="femaleFixed" name="Female Fixed" stroke="#e8568a" fill="url(#gf)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WeeklyLineChart({ data }: { data: Array<{ week: string; registrations: number; fixed: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e2a4a" vertical={false} />
        <XAxis dataKey="week" {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend iconType="circle" iconSize={8} />
        <Line type="monotone" dataKey="registrations" name="Registrations" stroke="#7c5cfc" strokeWidth={2} dot={{ r: 4, fill: '#7c5cfc' }} />
        <Line type="monotone" dataKey="fixed" name="Fixed" stroke="#00c9a7" strokeWidth={2} dot={{ r: 4, fill: '#00c9a7' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RevenueBarChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e2a4a" vertical={false} />
        <XAxis dataKey="month" {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v: unknown) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
        <Bar dataKey="revenue" name="Revenue" fill="#f5a623" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ['#7c5cfc', '#e8568a', '#00c9a7', '#f5a623', '#3b82f6'];

export function DonutChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ConversionBarChart({ data }: { data: Array<{ name: string; users: number; paid: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e2a4a" horizontal={false} />
        <XAxis type="number" {...AXIS_PROPS} />
        <YAxis dataKey="name" type="category" {...AXIS_PROPS} width={90} tick={{ fill: '#9b97c0', fontSize: 10 }} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend iconType="circle" iconSize={8} />
        <Bar dataKey="users" name="Registered" fill="#7c5cfc" radius={[0, 3, 3, 0]} />
        <Bar dataKey="paid" name="Paid" fill="#00c9a7" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
