// src/app/docs/terms/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — TikoZap",
  description:
    "Read the terms that explain how TikoZap works, what you can expect from us, and what we ask from you.",
};

export default function TermsPage() {
  return (
    <main id="main" className="legal-page">
      <section className="legal-hero">
        <div className="container-xl legal-container">
          <p className="legal-eyebrow">Terms of Service</p>

          <h1>Clear expectations. Fair for everyone.</h1>

          <p className="legal-intro">
            These Terms explain how TikoZap works, what you can expect from us,
            and what we ask from you in return.
          </p>

          <p className="legal-lead">
            By creating an account, accessing TikoZap, or using our services,
            you agree to these Terms.
          </p>

          <p className="legal-updated">Last updated: July 2026</p>
        </div>
      </section>

      <section className="legal-content-section">
        <div className="container-xl legal-container legal-content">
          <section className="legal-block">
            <h2>1. Using TikoZap</h2>

            <p>
              TikoZap provides an AI employee platform that helps businesses
              answer customer questions, support shoppers, manage
              conversations, and work alongside human team members.
            </p>

            <p>
              You are responsible for how you use TikoZap and for the
              information, instructions, products, policies, and other content
              you provide to your AI employee.
            </p>
          </section>

          <section className="legal-block">
            <h2>2. Your account</h2>

            <p>You are responsible for:</p>

            <ul>
              <li>Providing accurate account and business information</li>
              <li>Keeping your login credentials secure</li>
              <li>Managing access to your workspace</li>
              <li>Keeping your contact and billing information current</li>
              <li>All activity that occurs through your account</li>
            </ul>

            <p>
              Please contact us promptly if you believe your account has been
              accessed without permission.
            </p>
          </section>

          <section className="legal-block">
            <h2>3. Your AI employee</h2>

            <p>
              Your AI employee responds using the information you choose to
              provide, including products, policies, business knowledge,
              uploaded documents, customer conversations, and merchant
              coaching.
            </p>

            <p>
              We work to make TikoZap useful and reliable, but AI-generated
              responses may occasionally be incomplete, inaccurate, or
              unsuitable for a particular situation.
            </p>

            <div className="legal-callout">
              <strong>
                You are responsible for reviewing your AI employee&apos;s
                performance, correcting mistakes, and deciding when a human
                should step in.
              </strong>
            </div>

            <p>
              TikoZap is designed to support your business and team. It does not
              replace your judgment, supervision, or professional
              responsibilities.
            </p>
          </section>

          <section className="legal-block">
            <h2>4. Acceptable use</h2>

            <p>You may not use TikoZap to:</p>

            <ul>
              <li>Violate any law or regulation</li>
              <li>Harm, threaten, deceive, exploit, or harass others</li>
              <li>Send spam or unauthorized communications</li>
              <li>Distribute malware or harmful code</li>
              <li>Interfere with the security or operation of TikoZap</li>
              <li>Attempt to gain unauthorized access to systems or accounts</li>
              <li>Upload content you do not have the right to use</li>
              <li>Use the service for fraudulent or misleading activity</li>
              <li>
                Reverse engineer, copy, resell, or misuse the service except
                where expressly permitted
              </li>
            </ul>

            <p>
              We may restrict, suspend, or terminate access when we reasonably
              believe these Terms have been violated or the service is being
              misused.
            </p>
          </section>

          <section className="legal-block">
            <h2>5. Your content and business data</h2>

            <p>
              You retain ownership of the content and information you provide
              to TikoZap, including:
            </p>

            <ul>
              <li>Products and catalog information</li>
              <li>Business knowledge and policies</li>
              <li>Uploaded documents and images</li>
              <li>Customer conversations</li>
              <li>Merchant coaching and corrections</li>
              <li>Branding and assistant identity information</li>
            </ul>

            <p>
              You give TikoZap permission to process this information only as
              needed to provide, maintain, secure, and improve the service for
              your workspace.
            </p>

            <p>
              You are responsible for ensuring that you have the necessary
              rights and permissions to provide this content.
            </p>

            <p>
              Please review our{" "}
              <Link href="/docs/privacy">Privacy Policy</Link> for more
              information about how we handle data.
            </p>
          </section>

          <section className="legal-block">
            <h2>6. Subscriptions and billing</h2>

            <p>
              Some TikoZap features require a paid subscription. Prices,
              included usage, limits, and billing periods are shown on the
              Pricing page or within your Billing dashboard.
            </p>

            <p>
              By purchasing a subscription, you authorize us and our payment
              processor to charge the applicable fees and taxes using your
              selected payment method.
            </p>

            <p>
              Unless otherwise stated, subscriptions renew automatically until
              canceled.
            </p>

            <p>
              You may upgrade, downgrade, or cancel your subscription through
              the available billing tools. Plan changes may take effect
              immediately or at the end of the current billing period,
              depending on the selected change.
            </p>
          </section>

          <section className="legal-block">
            <h2>7. Trials, usage limits, and additional charges</h2>

            <p>
              Free trials and included usage are subject to the limits
              described on our Pricing page or within your account.
            </p>

            <p>
              Usage beyond your plan allowance may be restricted, paused, or
              billed at the applicable overage rate when overage billing is
              enabled.
            </p>

            <p>
              Promotional offers and trial terms may change and may be limited
              to eligible customers.
            </p>
          </section>

          <section className="legal-block">
            <h2>8. Cancellation and refunds</h2>

            <p>
              You may cancel your subscription at any time through your Billing
              dashboard or by contacting us.
            </p>

            <p>
              Unless required by law or expressly stated otherwise, payments
              already made are non-refundable. After cancellation, paid access
              generally continues through the end of the current billing
              period.
            </p>
          </section>

          <section className="legal-block">
            <h2>9. Availability and changes</h2>

            <p>
              We work hard to keep TikoZap available, secure, and reliable.
              However, no online service can guarantee uninterrupted or
              error-free operation.
            </p>

            <p>
              Maintenance, updates, third-party service interruptions, or
              unexpected technical issues may occasionally affect
              availability.
            </p>

            <p>
              We may modify, add, or remove features as TikoZap evolves. We will
              try to provide reasonable notice when a significant change
              materially affects paid service.
            </p>
          </section>

          <section className="legal-block">
            <h2>10. Third-party services</h2>

            <p>
              TikoZap may connect with or depend on third-party services,
              including payment processors, ecommerce platforms, cloud
              infrastructure, AI providers, email services, and communication
              tools.
            </p>

            <p>
              Your use of third-party services may also be governed by their
              own terms and policies. We are not responsible for third-party
              products or services that we do not control.
            </p>
          </section>

          <section className="legal-block">
            <h2>11. TikoZap intellectual property</h2>

            <p>
              TikoZap, its software, design, branding, documentation, and
              related materials are owned by Ala Moda Innovations LLC or its
              licensors.
            </p>

            <p>
              These Terms give you a limited, non-exclusive, non-transferable,
              revocable right to use TikoZap for your business in accordance
              with your plan and these Terms.
            </p>

            <p>
              These Terms do not transfer ownership of TikoZap or our
              intellectual property to you.
            </p>
          </section>

          <section className="legal-block">
            <h2>12. Feedback</h2>

            <p>
              We welcome ideas, suggestions, and feedback. If you provide
              feedback, you allow us to use it to improve TikoZap without
              restriction or compensation.
            </p>
          </section>

          <section className="legal-block">
            <h2>13. Suspension and termination</h2>

            <p>
              You may stop using TikoZap at any time.
            </p>

            <p>
              We may suspend or terminate access if you materially violate these
              Terms, fail to pay applicable fees, create security or legal
              risk, or misuse the service.
            </p>

            <p>
              When practical, we will try to provide notice and an opportunity
              to resolve the issue before termination.
            </p>
          </section>

          <section className="legal-block">
            <h2>14. Disclaimers</h2>

            <p>
              To the extent permitted by law, TikoZap is provided on an
              &quot;as is&quot; and &quot;as available&quot; basis.
            </p>

            <p>
              We do not guarantee that the service will always be available,
              error-free, or that every AI-generated answer will be accurate
              or appropriate.
            </p>

            <p>
              TikoZap does not provide legal, medical, financial, tax, or other
              professional advice.
            </p>
          </section>

          <section className="legal-block">
            <h2>15. Limitation of liability</h2>

            <p>
              To the fullest extent permitted by law, Ala Moda Innovations LLC
              and its affiliates will not be liable for indirect, incidental,
              special, consequential, exemplary, or punitive damages, or for
              lost profits, revenue, data, goodwill, or business opportunities
              arising from your use of TikoZap.
            </p>

            <p>
              To the fullest extent permitted by law, our total liability
              arising out of or relating to TikoZap will not exceed the amount
              you paid to TikoZap during the twelve months immediately before
              the event giving rise to the claim.
            </p>
          </section>

          <section className="legal-block">
            <h2>16. Indemnification</h2>

            <p>
              To the extent permitted by law, you agree to defend, indemnify,
              and hold harmless Ala Moda Innovations LLC and its affiliates
              from claims, losses, liabilities, and expenses arising from your
              content, your misuse of TikoZap, or your violation of these
              Terms.
            </p>
          </section>

          <section className="legal-block">
            <h2>17. Governing law</h2>

            <p>
              These Terms are governed by the laws of the State of New York,
              without regard to conflict-of-law principles.
            </p>

            <p>
              Any dispute arising from these Terms or TikoZap will be handled
              in the courts located in New York, unless applicable law requires
              otherwise.
            </p>

            <div className="legal-note">
              Your attorney may recommend more specific language here,
              including venue, arbitration, class-action waiver, or other
              dispute-resolution terms.
            </div>
          </section>

          <section className="legal-block">
            <h2>18. Changes to these Terms</h2>

            <p>
              As TikoZap evolves, we may update these Terms. When changes are
              made, we will update the date shown at the top of this page.
            </p>

            <p>
              We may provide additional notice when a change is significant.
              Your continued use of TikoZap after updated Terms take effect
              means you accept the revised Terms.
            </p>
          </section>

          <section className="legal-block">
            <h2>19. Entire agreement</h2>

            <p>
              These Terms, together with our Privacy Policy and any additional
              terms presented for a specific plan or service, form the agreement
              between you and Ala Moda Innovations LLC regarding TikoZap.
            </p>
          </section>

          <section className="legal-block legal-contact">
            <h2>20. Contact us</h2>

            <p>Questions about these Terms can be sent to:</p>

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
          max-width: 820px;
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

        .legal-updated {
          margin: 1.4rem 0 0;
          font-size: 0.88rem;
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

        .legal-block ul {
          margin: 0.9rem 0 0;
          padding-left: 1.35rem;
          color: #475569;
        }

        .legal-block li {
          margin: 0.45rem 0;
          line-height: 1.65;
        }

        .legal-block a {
          color: #2563eb;
          font-weight: 650;
          text-decoration: none;
        }

        .legal-block a:hover {
          text-decoration: underline;
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

        .legal-note {
          margin-top: 1.4rem;
          padding: 1rem 1.1rem;
          border: 1px solid #fde68a;
          border-radius: 1rem;
          background: #fffbeb;
          color: #92400e;
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .legal-contact > a {
          display: inline-block;
          margin-top: 0.8rem;
          font-size: 1.05rem;
          font-weight: 700;
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