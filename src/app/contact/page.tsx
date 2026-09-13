// src/app/contact/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — TikoZap",
  description:
    "Contact TikoZap with questions about your business, account, or AI teammate.",
};

export default function ContactPage() {
  return (
    <main id="main" className="contact-page">
      <section className="contact-hero">
        <div className="container-xl contact-container">
          <p className="contact-eyebrow">Contact</p>

          <h1>We&apos;d love to hear from you.</h1>

          <p className="contact-subtitle">
            Have a question about TikoZap, your account, or building a great AI
            teammate for your business? Send us an email.
          </p>
        </div>
      </section>

      <section className="contact-main">
        <div className="container-xl contact-container">
          <div className="contact-card">
            <p className="contact-label">Email us</p>

            <a
              className="contact-email"
              href="mailto:support@tikozap.com"
            >
              support@tikozap.com
            </a>

            <p className="contact-response">
              We usually reply within one business day.
            </p>
          </div>
        </div>
      </section>

      <section className="contact-closing">
        <div className="container-xl contact-closing-inner">
          <h2>Every business deserves a great AI teammate.</h2>
          <p>We&apos;re here to help you build yours.</p>
        </div>
      </section>

      <style>{`
        .contact-page {
          background: #ffffff;
          color: #111827;
        }

        .contact-container {
          max-width: 820px;
          margin-inline: auto;
        }

        .contact-hero {
          padding: 5rem 0 4.25rem;
          background:
            radial-gradient(
              circle at 82% 18%,
              rgba(99, 102, 241, 0.14),
              transparent 30%
            ),
            linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          border-bottom: 1px solid #e5e7eb;
        }

        .contact-eyebrow {
          margin: 0 0 0.8rem;
          color: #2563eb;
          font-size: 0.82rem;
          font-weight: 750;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .contact-hero h1 {
          margin: 0;
          font-size: clamp(44px, 6vw, 68px);
          line-height: 1.02;
          letter-spacing: -0.05em;
          font-weight: 850;
          color: #111827;
        }

        .contact-subtitle {
          max-width: 720px;
          margin: 1.45rem 0 0;
          font-size: clamp(19px, 1.8vw, 24px);
          line-height: 1.65;
          color: #475569;
        }

        .contact-main {
          padding: 5rem 0;
        }

        .contact-card {
          padding: 2.25rem;
          border: 1px solid #e5e7eb;
          border-radius: 1.35rem;
          background:
            linear-gradient(
              135deg,
              #ffffff 0%,
              #f8fafc 48%,
              #eef2ff 100%
            );
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
        }

        .contact-label {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .contact-email {
          display: inline-block;
          margin-top: 0.75rem;
          color: #2563eb;
          font-size: clamp(25px, 3vw, 36px);
          line-height: 1.2;
          letter-spacing: -0.025em;
          font-weight: 800;
          text-decoration: none;
          overflow-wrap: anywhere;
        }

        .contact-email:hover {
          text-decoration: underline;
        }

        .contact-response {
          margin: 1rem 0 0;
          color: #64748b;
          font-size: 1rem;
          line-height: 1.7;
        }

        .contact-closing {
          padding: 5rem 0 5.5rem;
          background: #f8fafc;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .contact-closing-inner {
          max-width: 820px;
          margin-inline: auto;
        }

        .contact-closing h2 {
          margin: 0;
          font-size: clamp(34px, 4vw, 52px);
          line-height: 1.08;
          letter-spacing: -0.045em;
          font-weight: 850;
          color: #111827;
        }

        .contact-closing p {
          margin: 1rem 0 0;
          color: #64748b;
          font-size: 1.15rem;
          line-height: 1.7;
        }

        @media (max-width: 640px) {
          .contact-hero {
            padding: 3.75rem 0 3.25rem;
          }

          .contact-main {
            padding: 3.5rem 0;
          }

          .contact-card {
            padding: 1.5rem;
          }

          .contact-closing {
            padding: 4rem 0 4.5rem;
          }
        }
      `}</style>
    </main>
  );
}