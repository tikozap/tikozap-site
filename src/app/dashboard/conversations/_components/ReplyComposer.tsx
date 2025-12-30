'use client';

import type { RefObject } from 'react';

type Props = {
  staffName: string;
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  replyRef: RefObject<HTMLTextAreaElement>;
};

export default function ReplyComposer({ staffName, draft, onDraftChange, onSend, replyRef }: Props) {
  return (
    <div className="cx-replyBox">
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Reply as Staff {staffName}</div>

      <textarea
        ref={replyRef}
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        rows={3}
        placeholder="Type your reply…"
        className="cx-textarea"
      />

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="db-btn primary" onClick={onSend}>
          Send
        </button>
      </div>
    </div>
  );
}
