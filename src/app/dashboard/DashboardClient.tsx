// src/app/dashboard/DashboardClient.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const KEY_TENANT_NAME = 'tz_demo_tenant_name';
const KEY_ONBOARDED = 'tz_demo_onboarded';
const KEY_LOGIN = 'tz_demo_logged_in';

export default function DashboardClient() {
  const [tenantName, setTenantName] = useState('Your store');

  useEffect(() => {
    const name = localStorage.getItem(KEY_TENANT_NAME);
    if (name) setTenantName(name);
  }, []);

  const resetDemo = () => {
    localStorage.removeItem(KEY_LOGIN);
    localStorage.removeItem(KEY_ONBOARDED);
    localStorage.removeItem(KEY_TENANT_NAME);
    localStorage.removeItem('tz_demo_tenant_slug');
    window.location.href = '/demo-login';
  };

  return (
    <main className="container py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm opacity-80">
              Workspace: <span className="font-medium">{tenantName}</span>
            </p>
          </div>

          <button
            onClick={resetDemo}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Reset demo
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <Card
            title="Conversations"
            desc="View shopper chats and see what your assistant answered."
            href="/dashboard"
            cta="Open Inbox (next)"
          />
          // in src/app/dashboard/DashboardClient.tsx
<Card title="Knowledge" ... href="/dashboard/knowledge" cta="Edit Knowledge" />
<Card title="Widget" ... href="/dashboard/widget" cta="Widget Settings" />
<Card title="Billing" ... href="/dashboard/billing" cta="Billing Settings" />

        </section>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold">Next build step</div>
          <p className="mt-1 text-sm opacity-80">
            We’ll create real pages under <code>/dashboard</code> (overview, conversations, settings) and connect auth + tenant data.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/onboarding/store"
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Re-run onboarding
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({ title, desc, href, cta }: { title: string; desc: string; href: string; cta: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-base font-semibold">{title}</div>
      <p className="mt-1 text-sm opacity-80">{desc}</p>
      <Link
        href={href}
        className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        {cta}
      </Link>
    </div>
  );
}
