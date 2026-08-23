// src/app/dashboard/page.tsx

import Link from 'next/link';

import { redirect } from 'next/navigation';

import { getAuthedUserAndTenant } from '@/lib/auth';

import SupportMetricsCards from './_components/SupportMetricsCards';

import MobilePageHeader from './_components/MobilePageHeader';

import OverviewVisualDashboard from './_components/OverviewVisualDashboard';

import { prisma } from '@/lib/prisma';


export default async function MerchantOverview() {
  const authed = await getAuthedUserAndTenant();

  if (!authed?.tenant?.id) {
    redirect('/login');
  }

const tenant = await prisma.tenant.findUnique({
  where: {
    id: authed.tenant.id,
  },
  select: {
    websiteUrl: true,
  },
});

const isWebsiteStore =
  Boolean(tenant?.websiteUrl?.trim());

const isStarterLinkStore = !isWebsiteStore;

  const launchHref = isStarterLinkStore
    ? '/dashboard/tikozap-link'
    : '/dashboard/widget';

  const launchTitle = isStarterLinkStore
    ? 'Set up Starter Link'
    : 'Set up Website Widget';

  const launchText = isStarterLinkStore
    ? 'Preview your public link and get it ready to share with customers.'
    : 'Install and test your assistant on your website.';

  return (
    <div>
      <MobilePageHeader title="Overview" />

<div className="db-top">
  <div>
    <h1 className="db-title">Overview</h1>
  </div>
</div>

      <div className="db-pageStack">
        <section className="db-section">
          <div
            style={{
              marginBottom: 14,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: '#111827',
              }}
            >
              Start here
            </h2>

            <p
              style={{
                margin: '5px 0 0',
                color: '#64748b',
                fontSize: 14,
              }}
            >
              Get your assistant ready, then launch when you&apos;re comfortable.
            </p>
          </div>

          <div className="db-grid">
            <div className="db-card">
              <div className="db-cardTitle">
                1. Meet your assistant
              </div>

              <p className="db-cardText">
                Review your assistant&apos;s identity and make sure it feels right for your store.
              </p>

              <Link
                href="/dashboard/assistant"
                className="db-btn"
              >
                Meet your assistant
              </Link>
            </div>

            <div className="db-card">
              <div className="db-cardTitle">
                2. Add store knowledge
              </div>

              <p className="db-cardText">
                Add products, policies, FAQs, and other information your assistant should understand.
              </p>

              <Link
                href="/dashboard/knowledge"
                className="db-btn"
              >
                Add knowledge
              </Link>
            </div>

            <div className="db-card">
              <div className="db-cardTitle">
                3. Test &amp; Coach
              </div>

              <p className="db-cardText">
                Ask customer-style questions and teach your assistant when an answer needs improvement.
              </p>

              <Link
                href="/dashboard/assistant/practice"
                className="db-btn"
              >
                Test &amp; Coach
              </Link>
            </div>

            <div className="db-card">
              <div className="db-cardTitle">
                4. {launchTitle}
              </div>

              <p className="db-cardText">
                {launchText}
              </p>

              <Link
                href={launchHref}
                className="db-btn"
              >
                {isStarterLinkStore
                  ? 'Open Starter Link'
                  : 'Open Widget'}
              </Link>
            </div>
          </div>
        </section>

        <section className="db-section">
          <OverviewVisualDashboard />
        </section>

        <section className="db-section db-metrics">
          <SupportMetricsCards />
        </section>
      </div>
    </div>
  );
}