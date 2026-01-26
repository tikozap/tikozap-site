// src/app/dashboard/settings/timezone/page.tsx
'use client';

import { useEffect, useState } from 'react';

const COMMON = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Australia/Sydney',
];

export default function TimezoneSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeZone, setTimeZone] = useState('America/New_York');
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/settings/timezone');
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to load');
      setTimeZone(String(data.timeZone || 'America/New_York'));
    } catch (e: any) {
      setMsg(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/settings/timezone', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ timeZone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to save');
      setMsg('Saved!');
    } catch (e: any) {
      setMsg(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold">Timezone</h2>
      <p className="mt-1 text-sm opacity-80">
        Used for date/time replies in Widget + Link chats (and the Inbox).
      </p>

      <div className="mt-5 grid gap-2">
        <label className="text-sm font-medium">Store timezone (IANA)</label>
        <input
          className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          list="tz-list"
          value={timeZone}
          onChange={(e) => setTimeZone(e.target.value)}
          disabled={loading || saving}
          placeholder="America/New_York"
        />
        <datalist id="tz-list">
          {COMMON.map((tz) => (
            <option key={tz} value={tz} />
          ))}
        </datalist>

        <div className="flex gap-2 mt-2">
          <button
            onClick={save}
            disabled={loading || saving}
            className="inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={load}
            disabled={loading || saving}
            className="inline-flex rounded-xl border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60"
          >
            Reload
          </button>
        </div>

        {msg ? <div className="text-sm mt-2 opacity-80">{msg}</div> : null}
      </div>
    </div>
  );
}
