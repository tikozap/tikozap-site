// src/app/use-cases/page.tsx

"use client";

import Link from "next/link";

const useCases = [
  {
    id: "ecommerce",
    icon: "🛍️",
    eyebrow: "E-commerce stores",
    title: "Add an AI employee to your online store",
    body:
      "Give customers fast help with products, shipping, returns, and common questions while you stay available to step in when needed.",
    points: [
      "Works with your store knowledge",
      "Handles customer conversations",
      "Lets your team take over anytime",
    ],
    cta: "Start your free trial",
    href: "/signup?plan=pro",
  },
  {
    id: "shopify",
    icon: "🛒",
    eyebrow: "Shopify widgets",
    title: "Help shoppers without sending them somewhere else",
    body:
      "Add the TikoZap Widget to your Shopify storefront so customers can ask questions while they browse and shop.",
    points: [
      "Customer help inside your storefront",
      "Uses your assistant and store knowledge",
      "Conversations stay available in Inbox",
    ],
    cta: "See how TikoZap works",
    href: "/features",
  },
  {
    id: "starter-link",
    icon: "🔗",
    eyebrow: "Starter Link",
    title: "No website? No problem.",
    body:
      "Launch a simple storefront with products, business information, and your AI assistant—all through one shareable link.",
    points: [
      "Hosted by TikoZap",
      "Add products and store information",
      "Share anywhere you talk with customers",
    ],
    cta: "Get started without a website",
    href: "/signup?plan=pro",
  },
  {
    id: "customer-support",
    icon: "💬",
    eyebrow: "AI customer support",
    title: "Customer help that keeps getting better",
    body:
      "Your assistant answers customers, works with your team, and improves through Knowledge, Test & Coach, and real conversation coaching.",
    points: [
      "Fast answers day and night",
      "Human takeover when needed",
      "Coach and improve your assistant over time",
    ],
    cta: "Meet your AI employee",
    href: "/features",
  },
];

export default function UseCasesPage() {
  return (
    <main id="main" className="useCases-page">
      <section className="useCases-hero">
        <div className="container-xl">
          <div className="useCases-inner useCases-heroInner">
            <p className="useCases-eyebrow">Use cases</p>

            <h1>Ways to use TikoZap</h1>

            <p className="useCases-lead">
              Whether you already have an online store or just need a simple
              way to help customers, TikoZap gives you an AI employee that can
              learn your business and work alongside you.
            </p>
          </div>
        </div>
      </section>

      <section className="useCases-list">
        <div className="container-xl">
          <div className="useCases-inner">
            {useCases.map((item, index) => (
              <section
                key={item.id}
                id={item.id}
                className={[
                  "useCase",
                  index % 2 === 1 ? "useCase-alt" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="useCase-icon" aria-hidden="true">
                  {item.icon}
                </div>

                <div className="useCase-copy">
                  <p className="useCase-eyebrow">
                    {item.eyebrow}
                  </p>

                  <h2>{item.title}</h2>

                  <p className="useCase-body">
                    {item.body}
                  </p>
                </div>

                <div className="useCase-details">
                  <ul>
                    {item.points.map((point) => (
                      <li key={point}>
                        {point}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={item.href}
                    className="useCase-cta"
                  >
                    {item.cta} →
                  </Link>
                </div>
              </section>
            ))}

            <section className="useCases-bottom">
              <div className="useCases-bottomCopy">
                <div className="useCases-bottomIcon" aria-hidden="true">
                  ✨
                </div>

                <div>
                  <h2>Not sure which setup fits your store?</h2>

                  <p>
                    Start with TikoZap and choose Widget, Starter Link,
                    or both as your business grows.
                  </p>
                </div>
              </div>

              <Link
                href="/signup?plan=pro"
                className="useCases-bottomButton"
              >
                Get started free →
              </Link>
            </section>
          </div>
        </div>
      </section>

      <style jsx>{`
        .useCases-page {
          background: #f8fafc;
          color: #111827;
        }

        .useCases-inner {
          width: 100%;
          max-width: 1020px;
          margin: 0 auto;
        }

        .useCases-hero {
          padding: 4rem 0 2.5rem;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
        }

        .useCases-heroInner {
          max-width: 760px;
        }

        .useCases-eyebrow,
        .useCase-eyebrow {
          margin: 0 0 8px;
          color: #2563eb;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .useCases-hero h1 {
          margin: 0;
          color: #111827;
          font-size: clamp(2.2rem, 5vw, 3.7rem);
          letter-spacing: -0.05em;
          line-height: 1;
        }

        .useCases-lead {
          max-width: 680px;
          margin: 16px 0 0;
          color: #64748b;
          font-size: 1rem;
          line-height: 1.7;
        }

        .useCases-list {
          padding: 30px 0 4rem;
        }

        .useCase {
          scroll-margin-top: 5.5rem;
          display: grid;
          grid-template-columns: 90px minmax(0, 1.15fr) minmax(280px, 0.9fr);
          gap: 24px;
          align-items: center;
          margin-bottom: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: #ffffff;
          padding: 24px;
          box-shadow: 0 7px 22px rgba(15, 23, 42, 0.035);
        }

        .useCase-alt {
          background: #f1f5f9;
        }

        .useCase-icon {
          width: 82px;
          height: 82px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.72);
          font-size: 42px;
        }

        .useCase h2 {
          margin: 0;
          color: #111827;
          font-size: clamp(1.35rem, 2.2vw, 1.9rem);
          letter-spacing: -0.035em;
          line-height: 1.12;
        }

        .useCase-body {
          margin: 10px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.65;
        }

        .useCase-details {
          min-width: 0;
          border-left: 1px solid #dbe3ea;
          padding-left: 24px;
        }

        .useCase ul {
          display: grid;
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .useCase li {
          position: relative;
          padding-left: 22px;
          color: #334155;
          font-size: 13px;
          line-height: 1.5;
        }

        .useCase li::before {
          content: "✓";
          position: absolute;
          left: 0;
          top: 0;
          color: #2563eb;
          font-weight: 900;
        }

        .useCase-cta {
          display: inline-flex;
          margin-top: 16px;
          color: #2563eb;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
        }

        .useCase-cta:hover {
          text-decoration: underline;
        }

        .useCases-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-top: 24px;
          border-radius: 18px;
          background: #eaf2ff;
          padding: 22px 24px;
        }

        .useCases-bottomCopy {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .useCases-bottomIcon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 48px;
          border-radius: 14px;
          background: #ffffff;
          font-size: 24px;
        }

        .useCases-bottom h2 {
          margin: 0;
          color: #111827;
          font-size: 20px;
          letter-spacing: -0.025em;
        }

        .useCases-bottom p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .useCases-bottomButton {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          border-radius: 12px;
          background: #2563eb;
          padding: 0 18px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }

        .useCases-bottomButton:hover {
          color: #ffffff;
          text-decoration: none;
        }

        @media (max-width: 760px) {
          .useCases-hero {
            padding: calc(1.8rem + 72px) 0 1.8rem;
          }

          .useCases-heroInner {
            max-width: none;
          }

          .useCase {
            grid-template-columns: 58px minmax(0, 1fr);
            gap: 14px;
            padding: 18px;
          }

          .useCase-icon {
            width: 54px;
            height: 54px;
            border-radius: 13px;
            font-size: 29px;
          }

          .useCase-copy {
            min-width: 0;
          }

          .useCase-details {
            grid-column: 1 / -1;
            border-left: none;
            border-top: 1px solid #dbe3ea;
            padding: 16px 0 0;
          }

          .useCases-bottom {
            align-items: stretch;
            flex-direction: column;
          }

          .useCases-bottomCopy {
            align-items: flex-start;
          }

          .useCases-bottomButton {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}