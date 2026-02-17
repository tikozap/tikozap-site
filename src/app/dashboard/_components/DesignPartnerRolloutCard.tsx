'use client';

import { useEffect, useMemo, useState } from 'react';

type RolloutItem = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  done: boolean;
  owner: string | null;
  notes: string | null;
  updatedAt: string;
};

type RolloutStatus = {
  items: RolloutItem[];
  completedCount: number;
  totalCount: number;
  completionPct: number;
};

type RolloutPayload = {
  ok: true;
  status: RolloutStatus;
};

export default function DesignPartnerRolloutCard() {
  const [status, setStatus] = useState<RolloutStatus | null>(null);
  const [error, setError] = useState('');
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      setError('');
      const res = await fetch('/api/design-partner/rollout', { cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as RolloutPayload | null;
      if (!res.ok || !data?.ok || !data?.status) {
        throw new Error('Rollout checklist unavailable.');
      }
      setStatus(data.status);
      const drafts: Record<string, string> = {};
      for (const item of data.status.items) {
        drafts[item.id] = item.owner || '';
      }
      setOwnerDrafts(drafts);
    } catch {
      setError('Design-partner rollout checklist unavailable.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sortedItems = useMemo(() => status?.items ?? [], [status]);

  const updateItem = async (args: {
    itemId: string;
    done?: boolean;
    owner?: string;
  }) => {
    if (busyItemId) return;
    setBusyItemId(args.itemId);
    try {
      const res = await fetch('/api/design-partner/rollout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(args),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data?.status) {
        throw new Error('Update failed.');
      }
      setStatus(data.status as RolloutStatus);
    } catch {
      setError('Could not update rollout item.');
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <div className="db-card db-tile" style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3>Design-partner rollout checklist</h3>
          <p>Operational checklist to onboard and prove partner value quickly.</p>
        </div>
        {status ? (
          <span className="db-pill">
            {status.completedCount}/{status.totalCount} ({status.completionPct}%)
          </span>
        ) : null}
      </div>

      {status ? (
        <div style={{ marginTop: 8, height: 8, background: '#e5e7eb', borderRadius: 999 }}>
          <span
            style={{
              display: 'block',
              height: '100%',
              width: `${status.completionPct}%`,
              background: '#111827',
              borderRadius: 999,
            }}
          />
        </div>
      ) : null}

      {error ? <p style={{ marginTop: 8, color: '#b91c1c' }}>{error}</p> : null}

      {!status ? (
        <p style={{ marginTop: 8 }}>Loading…</p>
      ) : (
        <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
          {sortedItems.map((item) => (
            <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(e) =>
                      updateItem({
                        itemId: item.id,
                        done: e.target.checked,
                      })
                    }
                    disabled={busyItemId === item.id}
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    <span style={{ display: 'block', fontWeight: 600 }}>{item.title}</span>
                    {item.description ? (
                      <span style={{ display: 'block', fontSize: 12, opacity: 0.75 }}>
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              </div>

              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  className="db-btn"
                  value={ownerDrafts[item.id] ?? ''}
                  onChange={(e) =>
                    setOwnerDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                  placeholder="Owner (name/email)"
                  style={{ minWidth: 220 }}
                />
                <button
                  type="button"
                  className="db-btn"
                  disabled={busyItemId === item.id}
                  onClick={() =>
                    updateItem({
                      itemId: item.id,
                      owner: ownerDrafts[item.id] ?? '',
                    })
                  }
                >
                  Save owner
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
