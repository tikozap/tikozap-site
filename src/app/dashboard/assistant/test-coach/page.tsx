// src/app/dashboard/assistant/test-coach/page.tsx

import Link from 'next/link';
import MobilePageHeader from '../../_components/MobilePageHeader';

export default function TestCoachPage() {
  return (
    <div className="db-container">
      <MobilePageHeader title="Test & Coach" />

      <div className="db-pageStack">
        <div className="tc-top">
          <div>
            <h1 className="db-title">Test & Coach</h1>
            <p className="db-sub">
              Practice with your assistant before the next customer conversation.
            </p>
          </div>
        </div>

        <section className="tc-hero">
          <div className="tc-icon" aria-hidden="true">
            🧪
          </div>

          <div className="tc-copy">
            <h2>Start a practice conversation</h2>

            <p>
              Ask questions like a real shopper, review your assistant’s
              responses, and provide coaching when something should be improved.
            </p>

            <Link
              href="/dashboard/conversations?testAssistant=1"
              className="tc-primary"
            >
              Start practice
            </Link>
          </div>
        </section>

        <section className="tc-card">
          <h2>How practice works</h2>

          <div className="tc-steps">
            <div className="tc-step">
              <span>1</span>
              <div>
                <h3>Ask a shopper question</h3>
                <p>
                  Test product details, shipping, returns, sizing, or any
                  question customers may ask.
                </p>
              </div>
            </div>

            <div className="tc-step">
              <span>2</span>
              <div>
                <h3>Review the response</h3>
                <p>
                  See how your assistant answers using your store knowledge,
                  policies, and products.
                </p>
              </div>
            </div>

            <div className="tc-step">
              <span>3</span>
              <div>
                <h3>Coach when needed</h3>
                <p>
                  Give clear guidance so your assistant can respond better in
                  future customer conversations.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .tc-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .tc-hero {
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr);
          gap: 16px;
          align-items: start;
          padding: 22px;
          border-radius: 22px;
          background: #111827;
          color: #ffffff;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16);
        }

        .tc-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .tc-copy h2 {
          margin: 0;
          font-size: 20px;
          line-height: 1.3;
        }

        .tc-copy p {
          margin: 8px 0 0;
          max-width: 680px;
          color: rgba(255, 255, 255, 0.74);
          font-size: 14px;
          line-height: 1.6;
        }

        .tc-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          margin-top: 18px;
          padding: 9px 16px;
          border-radius: 999px;
          background: #ffffff;
          color: #111827;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
        }

        .tc-primary:hover {
          background: #f3f4f6;
        }

        .tc-card {
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }

        .tc-card > h2 {
          margin: 0;
          color: #111827;
          font-size: 18px;
        }

        .tc-steps {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 16px;
        }

        .tc-step {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #f8fafc;
        }

        .tc-step > span {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: #111827;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
        }

        .tc-step h3 {
          margin: 1px 0 0;
          color: #111827;
          font-size: 14px;
        }

        .tc-step p {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.55;
        }

        @media (max-width: 1000px) {
          .tc-top {
            padding: 0 12px;
          }

          .tc-hero,
          .tc-card {
            margin-left: 12px;
            margin-right: 12px;
          }

          .tc-steps {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .tc-hero {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}