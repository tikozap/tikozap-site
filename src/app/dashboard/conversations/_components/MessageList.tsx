'use client';

export type ThreadMessage = { id: string; role: string; content: string; createdAt: string };

type Props = {
  messages: ThreadMessage[];
  fmtTime: (iso: string) => string;
  roleLabel: (role: string) => string;

  isDraftNote: (text: string) => boolean;
  onInsertDraft: (noteText: string) => void;
};

export default function MessageList({ messages, fmtTime, roleLabel, isDraftNote, onInsertDraft }: Props) {
  return (
    <div className="cx-msgList">
      {messages.map((m) => {
        const showInsert = m.role === 'note' && isDraftNote(m.content);

        return (
          <div key={m.id} style={{ display: 'grid', gap: 6 }}>
            <div className="cx-msgMeta">
              <strong>{roleLabel(m.role)}</strong> · {fmtTime(m.createdAt)}
            </div>

            <div
              className={[
                'cx-bubble',
                m.role === 'staff' ? 'agent' : '',
                m.role === 'note' ? 'note' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>

              {showInsert && (
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="db-btn" onClick={() => onInsertDraft(m.content)}>
                    Insert draft
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
