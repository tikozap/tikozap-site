// src/app/reset-password/page.tsx

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setMessage('');

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== passwordConfirm) {
      setMessage('Passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Could not reset password.');
      }

      setDone(true);
      setMessage('Password has been reset.');
    } catch (err: any) {
      setMessage(err?.message || 'Could not reset password.');
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
              <h1>Create a new password</h1>
              <p className="sub">
                Choose a new password for your TikoZap account.
              </p>
            </div>

            {!token ? (
              <p className="small auth-footnote">
                This reset link is missing a token. Please request a new reset link.
              </p>
            ) : done ? (
              <div className="auth-form">
                <p className="small auth-footnote">{message}</p>
                <Link className="button auth-primary" href="/login">
                  Log in
                </Link>
              </div>
            ) : (
              <form className="auth-form" onSubmit={submit}>
                <div className="field">
                  <label htmlFor="new-password">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="new-password-confirm">Confirm new password</label>
                  <input
                    id="new-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Repeat password"
                    required
                  />
                </div>

                <button type="submit" className="button auth-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Reset password'}
                </button>

                {message ? <p className="small auth-footnote">{message}</p> : null}
              </form>
            )}

            <p className="tiny auth-alt-link">
              Back to <Link href="/login">login</Link>.
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

        .auth-alt-link a {
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