// src/app/dashboard/conversations/_components/ConversationList.tsx
'use client';

import React from 'react';

type Preview = { role: string; content: string; createdAt: string };

type ListItem = {
  id: string;
  customerName: string;
  subject: string;
  status: 'open' | 'waiting' | 'closed';
  channel: string;
  aiEnabled: boolean;
  tags: string[];
  lastMessageAt: string;
  archivedAt?: string | null;
  preview: Preview | null;
};

type ConversationListProps = {
  items: ListItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  fmtTime: (iso: string) => string;
  roleLabel: (role: string) => string;
  hidden?: boolean;
};

export default function ConversationList({
  items,
  selectedId,
  onSelect,
  fmtTime,
  roleLabel,
  hidden,
}: ConversationListProps) {
  const className = ['db-card', 'cx-list', 'cx-pane', hidden ? 'is-hidden' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      {items.map((c) => {
        const active = c.id === selectedId;
        const primaryTag = c.tags[0]; // only show first tag in list to save space

        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={['cx-item', active ? 'active' : ''].filter(Boolean).join(' ')}
          >
            {/* Top row: Emma | Dec 24 02:50 PM | Open */}
            <div className="cx-headRow">
              <div className="cx-customer">{c.customerName}</div>
              <div className="cx-time">{fmtTime(c.lastMessageAt)}</div>
              <div className="cx-status">{c.status}</div>
            </div>

            {/* Body: left = subject + preview, right = channel / AI / tag */}
            <div className="cx-bodyRow">
              <div className="cx-mainCol">
                <div className="cx-subject">{c.subject}</div>
                <div className="cx-preview">
                  {c.preview
                    ? `${roleLabel(c.preview.role)}: ${c.preview.content.slice(0, 80)}`
                    : 'No messages yet'}
                </div>
              </div>

              <div className="cx-sideCol">
                <span className="db-pill">{c.channel}</span>
                {c.aiEnabled && <span className="db-pill">AI reply</span>}
                {primaryTag && <span className="db-pill">{primaryTag}</span>}
              </div>
            </div>
          </button>
        );
      })}

      {!items.length && (
        <div style={{ padding: 12, fontSize: 13, opacity: 0.7 }}>
          No conversations yet. Click “Reset inbox”.
        </div>
      )}
    </div>
  );
}
