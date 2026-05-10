// src/app/dashboard/_components/OverviewVisualDashboard.tsx

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const trend = [
  { day: 'Mon', chats: 18 },
  { day: 'Tue', chats: 26 },
  { day: 'Wed', chats: 22 },
  { day: 'Thu', chats: 34 },
  { day: 'Fri', chats: 41 },
  { day: 'Sat', chats: 29 },
  { day: 'Sun', chats: 37 },
];

const channels = [
  { name: 'Web', value: 42 },
  { name: 'Starter Link', value: 38 },
  { name: 'Email', value: 12 },
  { name: 'Phone', value: 8 },
];

const colors = ['#3b82f6', '#64748b', '#cbd5e1', '#e5e7eb'];

export default function OverviewVisualDashboard() {
  return (
    <section className="ov-visual">
      <div className="ov-card ov-chartMain">
        <div className="ov-cardTitle">Chat volume</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trend}>
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="chats" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="ov-card">
        <div className="ov-cardTitle">Channels</div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={channels} dataKey="value" innerRadius={62} outerRadius={86} paddingAngle={3}>
              {channels.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="ov-legend">
          {channels.map((c, i) => (
            <div key={c.name}>
              <span style={{ background: colors[i] }} />
              {c.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}