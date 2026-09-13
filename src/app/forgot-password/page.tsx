// src/app/forgot-password/page.tsx

'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [devLink, setDevLink] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);
    setMessage('');
    setDevLink('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Could not send reset link.');
      }

      setMessage(data.message || 'If that email exists, a reset link has been sent.');
      if (data.resetUrl) setDevLink(data.resetUrl);
    } catch (err: any) {
      setMessage(err?.message || 'Could not send reset link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-main">
      <section className="auth-layout">
        <div className="container">
          <div className="auth-card">
            <div>
              <h1>Reset your password</h1>
              <p className="sub">
                Enter the email address for your TikoZap account. If the account exists,
                we’ll send a reset link.
              </p>
            </div>

            <form className="auth-form" onSubmit={submit}>
              <div className="field">
                <label htmlFor="reset-email">Work email</label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@store.com"
                  required
                />
              </div>

              <button type="submit" className="button auth-primary" disabled={busy}>
                {busy ? 'Sending…' : 'Send reset link'}
              </button>

              {message ? <p className="small auth-footnote">{message}</p> : null}

              {devLink ? (
                <p className="small auth-footnote">
                  Dev reset link:{' '}
                  <Link href={devLink}>
                    Open reset page
                  </Link>
                </p>
              ) : null}
            </form>

            <p className="tiny auth-alt-link">
              Remember your password? <Link href="/login">Log in</Link>.
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .auth-main {
          padding-top: 4.5rem;
          padding-bottom: 3rem;
        }

        .auth-layout {
          padding: 1.75rem 0 0;
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
          margin-top: 0.5rem;
          color: #6b7280;
        }

        .auth-alt-link a,
        .auth-footnote a {
          text-decoration: underline;
        }

        .tiny {
          font-size: 0.8rem;
        }

        @media (min-width: 768px) {
          .auth-card {
            max-width: 520px;
            margin: 0 auto;
            padding: 1.5rem 1.75rem;
          }
        }
      `}</style>
    </main>
  );
}