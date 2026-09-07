// src/app/dashboard/_components/MobilePageHeader.tsx

'use client';

import type { ReactNode } from 'react';

type Props = {
  title: string;
  rightAction?: ReactNode;
};

export default function MobilePageHeader({
  title,
  rightAction,
}: Props) {
  return (
    <>
      <div className="db-mobilePageTop">
        <button
          type="button"
          className="db-pageIconBtn"
          aria-label="Open dashboard menu"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent('tz-dashboard-toggle-nav')
            );
          }}
        >
          <svg
            width="24"
            height="30"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="9"
              y1="5"
              x2="9"
              y2="19"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>

        <div className="db-mobilePageTitle">{title}</div>

        <div className="db-mobilePageAction">
          {rightAction || (
            <div
              className="db-pageIconBtn db-pageIconBtn--ghost"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      <style>{`
        .db-mobilePageTop {
          display: none;
        }

        .db-mobilePageTop .db-pageIconBtn {
          width: 48px;
          height: 48px;
          min-width: 48px;
          min-height: 48px;
          border-radius: 14px;
          border: none;
          background: transparent;
          color: #111827;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 48px;
          box-shadow: none;
          padding: 0;
        }

        .db-pageIconBtn svg {
          display: block;
        }

        .db-pageIconBtn--ghost {
          visibility: hidden;
        }

        .db-mobilePageAction {
          width: 48px;
          min-width: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 1000px) {
          .db-mobilePageTop {
            display: grid;
            grid-template-columns: 48px 1fr 48px;
            align-items: center;
            gap: 10px;

            position: sticky;
            top: 0;
            z-index: 100;

            width: 100vw;
            margin-left: calc(50% - 50vw);
            margin-right: calc(50% - 50vw);

            background: #f8fafc;
            border-bottom: 1px solid #e5e7eb;
            box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);

            padding: 8px 16px 12px;
            margin-bottom: 12px;
            box-sizing: border-box;
          }

          .db-mobilePageTitle {
            text-align: center;
            font-size: 18px;
            font-weight: 800;
            color: #111827;
          }

          .db-title {
            display: none;
          }
        }
      `}</style>
    </>
  );
}