'use client';

import Link from 'next/link';
import { FormEvent } from 'react';

export default function LoginPage() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: wire up to real login later
  };

  return (
    <main id="main" className="auth-main">
      {/* Page header */}
      <section className="auth-hero">
        <div className="container auth-hero-inner">
          <p className="eyebrow">Welcome back</p>
          <h1>Log in to TikoZap</h1>
          <p className="sub">
            Use the email and password you used to create your account to access your dashboard and
            conversations.
          </p>
        </div>
      </section>

      {/* Login card */}
      <section className="auth-layout">
        <div className="container">
          <div className="auth-card">
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="login-email">Work email</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@store.com"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button type="submit" className="button auth-primary">
                Log in
              </button>

              <p className="small auth-footnote">
                Forgot your password? We&apos;ll add reset links once authentication is connected.
              </p>
            </form>

            <p className="tiny auth-alt-link">
              New to TikoZap? <Link href="/signup?plan=pro">Start your free trial</Link>.
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .auth-main {
          padding-top: 4.5rem; /* fixed nav offset */
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
          gap: 1rem;
          max-width: 480px;
          margin: 0 auto;
        }

        .auth-form {
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

        .auth-primary {
          width: 100%;
          margin-top: 0.25rem;
        }

        .auth-footnote {
          margin-top: 0.4rem;
          color: #6b7280;
        }

        .auth-alt-link {
          margin-top: 0.25rem;
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
            padding: 1.5rem 1.75rem;
          }
        }
      `}</style>
    </main>
  );
}
