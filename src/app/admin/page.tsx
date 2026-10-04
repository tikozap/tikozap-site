// src/app/admin/page.tsx

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/admin';
import { getUserId } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
const userId = await getUserId();

if (!userId) {
  redirect('/login');
}

const admin = await requireAdmin();

if (!admin) {
  redirect('/dashboard');
}
  return (
    <main className="adminHome">
      <div className="adminHomeHeader">
        <p className="adminEyebrow">
          TikoZap Internal
        </p>

        <h1>Admin Console</h1>

        <p className="adminSub">
          Internal tools for managing merchants and Tiko.
        </p>
      </div>

      <div className="adminHomeGrid">
        <Link
          href="/admin/tenants"
          className="adminHomeCard"
        >
          <div className="adminHomeIcon" aria-hidden="true">
            🏪
          </div>

          <div>
            <h2>Tenants</h2>

            <p>
              Manage merchant accounts, plans, channels,
              Voice, Phone Agent, and account status.
            </p>
          </div>

          <span className="adminHomeAction">
            Open tenants →
          </span>
        </Link>

        <Link
          href="/admin/tiko"
          className="adminHomeCard"
        >
          <div className="adminHomeIcon" aria-hidden="true">
            ✨
          </div>

          <div>
            <h2>Tiko</h2>

            <p>
              Test &amp; Coach Tiko and review Tiko&apos;s
              Notebook.
            </p>
          </div>

          <span className="adminHomeAction">
            Open Tiko →
          </span>
        </Link>
      </div>

      <style>{`
        .adminHome {
          min-height: 100vh;
          box-sizing: border-box;
          padding: 48px 24px;
          background: #f8fafc;
          color: #111827;
        }

        .adminHomeHeader,
        .adminHomeGrid {
          width: 100%;
          max-width: 980px;
          margin-left: auto;
          margin-right: auto;
        }

        .adminHomeHeader {
          margin-bottom: 28px;
        }

        .adminEyebrow {
          margin: 0 0 8px;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .adminHomeHeader h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.15;
          letter-spacing: -0.03em;
        }

        .adminSub {
          margin: 10px 0 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.6;
        }

        .adminHomeGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .adminHomeCard {
          min-height: 220px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 22px;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          background: #ffffff;
          color: inherit;
          text-decoration: none;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
          transition:
            transform 140ms ease,
            box-shadow 140ms ease,
            border-color 140ms ease;
        }

        .adminHomeCard:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
          box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
        }

        .adminHomeIcon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #f8fafc;
          font-size: 21px;
        }

        .adminHomeCard h2 {
          margin: 0;
          font-size: 19px;
          line-height: 1.3;
        }

        .adminHomeCard p {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .adminHomeAction {
          margin-top: auto;
          color: #111827;
          font-size: 13px;
          font-weight: 800;
        }

        @media (max-width: 700px) {
          .adminHome {
            padding: 32px 16px;
          }

          .adminHomeGrid {
            grid-template-columns: 1fr;
          }

          .adminHomeCard {
            min-height: 190px;
          }
        }
      `}</style>
    </main>
  );
}