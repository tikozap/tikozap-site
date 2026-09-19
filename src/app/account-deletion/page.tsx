// src/app/account-deletion/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete Your Account — TikoZap",
  description:
    "Learn how to permanently delete your TikoZap account and associated data.",
};

export default function AccountDeletionPage() {
  return (
    <main id="main" className="legal-page">
      <section className="legal-hero">
        <div className="container-xl legal-container">
          <p className="legal-eyebrow">Account Deletion</p>

          <h1>Delete your TikoZap account.</h1>

          <p className="legal-intro">
            You&apos;re in control of your TikoZap account and your business
            data.
          </p>

          <p className="legal-lead">
            TikoZap account owners can permanently delete their account and
            associated store data from TikoZap.
          </p>
        </div>
      </section>

      <section className="legal-content-section">
        <div className="container-xl legal-container legal-content">
          <section className="legal-block">
            <h2>How to delete your account</h2>

            <p>To permanently delete your TikoZap account:</p>

            <ol>
              <li>Sign in to your TikoZap account.</li>
              <li>Open <strong>Settings</strong>.</li>
              <li>
                Under <strong>General</strong>, find the{" "}
                <strong>Account</strong> section.
              </li>
              <li>
                Select <strong>Delete account</strong>.
              </li>
              <li>
                Type <strong>DELETE</strong> to confirm.
              </li>
            </ol>

            <div className="legal-callout">
              <strong>
                Account deletion is permanent and cannot be undone.
              </strong>
            </div>
          </section>

          <section className="legal-block">
            <h2>What is deleted</h2>

            <p>
              When your account is deleted, TikoZap deletes the account and
              associated store data that we are not required to retain,
              including applicable:
            </p>

            <ul>
              <li>Account and store information</li>
              <li>Business knowledge and assistant settings</li>
              <li>Customer conversation data</li>
              <li>Merchant coaching and assistant learning history</li>
              <li>Uploaded business content</li>
            </ul>

            <p>
              Active TikoZap subscriptions associated with the deleted store
              are also canceled.
            </p>
          </section>

                    <section className="legal-block">
            <h2>Delete specific data without deleting your account</h2>

            <p>
              You can delete certain information from TikoZap without deleting
              your account.
            </p>

            <p>
              For example, individual learning entries can be removed from your
              assistant&apos;s Memory:
            </p>

            <ol>
              <li>Sign in to your TikoZap account.</li>
              <li>
                Open <strong>Assistant → Memory</strong>.
              </li>
              <li>Find the learning entry you want to remove.</li>
              <li>
                Select <strong>Delete</strong>.
              </li>
            </ol>

            <p>
              Deleting an individual learning entry removes that learning from
              your assistant while keeping your TikoZap account active.
            </p>
          </section>

          <section className="legal-block">
            <h2>Information we may retain</h2>

            <p>
              Certain limited information may be retained when required for
              legal, security, fraud-prevention, billing, dispute-resolution,
              or other legitimate business purposes.
            </p>

            <p>
              Information that no longer needs to be retained may be deleted
              or anonymized in accordance with our Privacy Policy and
              applicable requirements.
            </p>
          </section>

          <section className="legal-block legal-contact">
            <h2>Need help?</h2>

            <p>
              If you cannot access your account or need assistance with account
              deletion, contact TikoZap Support:
            </p>

            <a href="mailto:support@tikozap.com">support@tikozap.com</a>

            <p className="legal-company">
              Ala Moda Innovations LLC
              <br />
              TikoZap
            </p>
          </section>
        </div>
      </section>

      <style>{`
        .legal-page {
          background: #ffffff;
          color: #111827;
        }

        .legal-container {
          max-width: 900px;
          margin-inline: auto;
        }

        .legal-hero {
          padding: 4.5rem 0 3.5rem;
          background:
            radial-gradient(
              circle at 82% 15%,
              rgba(99, 102, 241, 0.12),
              transparent 28%
            ),
            linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          border-bottom: 1px solid #e5e7eb;
        }

        .legal-eyebrow {
          margin: 0 0 0.8rem;
          color: #2563eb;
          font-size: 0.82rem;
          font-weight: 750;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .legal-hero h1 {
          margin: 0;
          font-size: clamp(42px, 5vw, 64px);
          line-height: 1.02;
          letter-spacing: -0.05em;
          font-weight: 850;
          color: #111827;
        }

        .legal-intro {
          max-width: 760px;
          margin: 1.35rem 0 0;
          font-size: clamp(21px, 2vw, 27px);
          line-height: 1.45;
          color: #334155;
        }

        .legal-lead {
          max-width: 760px;
          margin: 1.1rem 0 0;
          font-size: 1.08rem;
          line-height: 1.75;
          color: #64748b;
        }

        .legal-content-section {
          padding: 3.5rem 0 5rem;
        }

        .legal-content {
          display: grid;
          gap: 2.8rem;
        }

        .legal-block {
          padding-bottom: 2.8rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .legal-block:last-child {
          padding-bottom: 0;
          border-bottom: 0;
        }

        .legal-block h2 {
          margin: 0 0 1rem;
          font-size: clamp(25px, 2.5vw, 32px);
          line-height: 1.2;
          letter-spacing: -0.025em;
          color: #111827;
        }

        .legal-block p {
          margin: 0.75rem 0 0;
          font-size: 1rem;
          line-height: 1.75;
          color: #475569;
        }

        .legal-block ul,
        .legal-block ol {
          margin: 0.9rem 0 0;
          padding-left: 1.35rem;
          color: #475569;
        }

        .legal-block li {
          margin: 0.6rem 0;
          line-height: 1.65;
        }

        .legal-callout {
          margin-top: 1.4rem;
          padding: 1.1rem 1.2rem;
          border: 1px solid #c7d2fe;
          border-radius: 1rem;
          background: #eef2ff;
          color: #3730a3;
          line-height: 1.6;
        }

        .legal-contact a {
          display: inline-block;
          margin-top: 0.8rem;
          color: #2563eb;
          font-size: 1.05rem;
          font-weight: 700;
          text-decoration: none;
        }

        .legal-contact a:hover {
          text-decoration: underline;
        }

        .legal-company {
          margin-top: 1.5rem !important;
          color: #64748b !important;
        }

        @media (max-width: 640px) {
          .legal-hero {
            padding: 3.25rem 0 2.75rem;
          }

          .legal-content-section {
            padding: 2.75rem 0 4rem;
          }

          .legal-content {
            gap: 2.25rem;
          }

          .legal-block {
            padding-bottom: 2.25rem;
          }
        }
      `}</style>
    </main>
  );
}