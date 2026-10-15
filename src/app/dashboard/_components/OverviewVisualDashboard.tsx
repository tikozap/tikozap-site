// src/app/dashboard/_components/OverviewVisualDashboard.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
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

type OverviewPayload = {
  ok: true;
  overview: {
    trend: Array<{ day: string; chats: number }>;
    channels: Array<{ name: string; value: number }>;
  };
};

const colors = ['#3b82f6', '#64748b', '#cbd5e1', '#e5e7eb'];

const emptyTrend = [
  { day: 'Mon', chats: 0 },
  { day: 'Tue', chats: 0 },
  { day: 'Wed', chats: 0 },
  { day: 'Thu', chats: 0 },
  { day: 'Fri', chats: 0 },
  { day: 'Sat', chats: 0 },
  { day: 'Sun', chats: 0 },
];

const emptyChannels = [
  { name: 'Web', value: 0 },
  { name: 'Starter Link', value: 0 },
  { name: 'Email', value: 0 },
  { name: 'Phone', value: 0 },
];

export default function OverviewVisualDashboard() {
  const [data, setData] = useState<OverviewPayload['overview'] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch('/api/dashboard/overview', { cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (!cancelled && res.ok && json?.ok) {
        setData(json.overview);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const trend = data?.trend || emptyTrend;
  const channels = data?.channels || emptyChannels;

  const hasChannelData = useMemo(
    () => channels.some((c) => c.value > 0),
    [channels],
  );

  const chartChannels = hasChannelData
    ? channels
    : channels.map((c, i) => ({ ...c, value: i === 0 ? 1 : 0 }));

  return (
    <section className="ov-visual">
      <div className="ov-card ov-chartMain">
        <div className="ov-cardTitle">Chat volume</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trend}>
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="chats"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="ov-card">
        <div className="ov-cardTitle">Channels</div>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartChannels}
              dataKey="value"
              innerRadius={62}
              outerRadius={86}
              paddingAngle={3}
            >
              {chartChannels.map((_, i) => (
                <Cell key={i} fill={colors[i] || '#e5e7eb'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="ov-legend">
          {channels.map((c, i) => (
            <div key={c.name}>
              <span style={{ background: colors[i] || '#e5e7eb' }} />
              {c.name} {c.value > 0 ? `(${c.value})` : ''}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}