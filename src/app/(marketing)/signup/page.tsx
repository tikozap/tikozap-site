'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // Real signup will be wired later.
    setSubmitted(true);
  };

  return (
    <main id="main" className="auth-main">
      <section className="auth-hero">
        <div className="container auth-hero-inner">
          <p className="eyebrow">Get started</p>
          <h1>Create your TikoZap account</h1>
          <p className="sub">
            You&apos;ll start with a 14-day free Pro trial. No credit card required, and you can
            change plans or cancel anytime.
          </p>
        </div>
      </section>

      <section className="auth-layout">
        <div className="container">
          <div className="auth-card">
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="signup-name">Full name</label>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="signup-email">Work email</label>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@store.com"
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="signup-store">Store URL</label>
                <input
                  id="signup-store"
                  name="storeUrl"
                  type="url"
                  placeholder="https://yourstore.com"
                  required
                />
                <p className="tiny field-hint">
                  Use your main storefront. You can connect more sites later.
                </p>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="signup-password">Password</label>
                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="signup-password-confirm">Confirm password</label>
                  <input
                    id="signup-password-confirm"
                    name="passwordConfirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="button auth-primary">
                Create account
              </button>

              {submitted ? (
                <p className="small auth-footnote">
                  ✅ Thanks! Signup isn&apos;t wired yet — for now, use <b>/demo-login</b> to test the
                  merchant dashboard.
                </p>
              ) : (
                <p className="small auth-footnote">
                  You&apos;ll get full Pro features for 14 days. We&apos;ll remind you before your trial ends.
                </p>
              )}
            </form>

            <ul className="auth-perks small">
              <li>Connect your catalog, policies, and FAQ.</li>
              <li>Test TikoZap on your own store before you commit.</li>
              <li>Invite your team when you&apos;re ready.</li>
            </ul>

            <p className="tiny auth-alt-link">
              Already have an account? <Link href="/login">Log in</Link>.
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .auth-main {
          padding-top: 4.5rem;
          padding-bottom: 3rem;
        }
        .auth-hero {
          padding: 1.75rem 0 1.25rem;
        }
        .auth-hero-inner {
          max-width: 40rem;
        }
        .auth-hero h1 {
          margin-bottom: 0.5rem;
        }
        .auth-layout {
          padding: 0.25rem 0 0;
        }
        .auth-card {
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 1.25rem;
          display: grid;
          gap: 1.25rem;
        }
        .auth-form {
          display: grid;
          gap: 0.75rem;
        }
        .field-row {
          display: grid;
          gap: 0.75rem;
        }
        .field {
          display: grid;
          gap: 0.25rem;
        }
        .field label {
          font-size: 0.85rem;
          color: #374151;
        }
        .field input {
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          padding: 0.55rem 0.65rem;
          font-size: 0.9rem;
        }
        .field input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 1px #2563eb20;
        }
        .field-hint {
          margin: 0.1rem 0 0;
          color: #6b7280;
        }
        .auth-primary {
          width: 100%;
          margin-top: 0.25rem;
        }
        .auth-footnote {
          margin-top: 0.4rem;
          color: #6b7280;
        }
        .auth-perks {
          margin: 0;
          padding-left: 1.1rem;
          color: #4b5563;
        }
        .auth-perks li + li {
          margin-top: 0.2rem;
        }
        .auth-alt-link {
          margin-top: 0.5rem;
          color: #6b7280;
        }
        .auth-alt-link a {
          text-decoration: underline;
        }
        .tiny {
          font-size: 0.8rem;
        }
        @media (min-width: 768px) {
          .auth-card {
            max-width: 720px;
            margin: 0 auto;
            padding: 1.5rem 1.75rem;
          }
          .field-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
}