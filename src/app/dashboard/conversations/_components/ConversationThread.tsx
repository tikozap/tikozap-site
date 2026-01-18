'use client';

import React, { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

type ThreadMessage = {
  id: string;
  role: string; // 'customer' | 'assistant' | 'staff' | 'note'
  content: string;
  createdAt: string;
};

type Thread = {
  id: string;
  customerName: string;
  subject: string;
  status: 'open' | 'waiting' | 'closed';
  channel: string;
  aiEnabled: boolean;
  tags: string[];
  lastMessageAt: string;
  archivedAt?: string | null;
  messages: ThreadMessage[];
};

type Props = {
  thread: Thread | null;
  hidden: boolean;
  isMobile: boolean;
  onBackToList: () => void;

  staffName: string;
  assistantName: string;
  fmtTime: (iso: string) => string;
  roleLabel: (role: string) => string;
  isDraftNote: (text: string) => boolean;

  onTakeOver: () => void;
  onResumeAi: () => void;
  onGenerateDraft: () => void;
  onAddNote: () => void;
  onClose: () => void;
  onReopen: () => void;
  onMarkWaiting: () => void;
  onArchive: () => void;
  onRestore: () => void;

  tagDraft: string;
  onTagDraftChange: (val: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;

  onInsertDraft: (noteText: string) => void;

  draft: string;
  onDraftChange: (val: string) => void;
  onSendReply: () => void;
  replyRef: RefObject<HTMLTextAreaElement>;
};

export default function ConversationThread({
  thread,
  hidden,

  // keep in Props but do NOT destructure if unused
  // isMobile,
  // onBackToList,
  staffName,
  // assistantName,

  fmtTime,
  roleLabel,
  isDraftNote,
  onTakeOver,
  onResumeAi,
  onGenerateDraft,
  onAddNote,
  onClose,
  onReopen,
  onMarkWaiting,
  onArchive,
  onRestore,
  tagDraft,
  onTagDraftChange,
  onAddTag,
  onRemoveTag,
  onInsertDraft,
  draft,
  onDraftChange,
  onSendReply,
  replyRef,
}: Props) {
  const [hiddenDraftIds, setHiddenDraftIds] = useState<string[]>([]);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const threadId = thread?.id ?? '';
  const msgLen = thread?.messages?.length ?? 0;

  const scrollPosByThreadRef = useRef<Record<string, number>>({});
  const stickToBottomRef = useRef(true);
  const BOTTOM_THRESHOLD = 80;

  // Reset hidden draft blocks when switching threads
  useEffect(() => {
    setHiddenDraftIds([]);
  }, [threadId]);

  // Restore scroll position on thread switch (or go bottom first time).
  // IMPORTANT: do this in layout so the user doesn't see a jump.
  useLayoutEffect(() => {
    if (!threadId) return;
    const el = messagesRef.current;
    if (!el) return;

    const saved = scrollPosByThreadRef.current[threadId];

    // Restore previous position if we have it; otherwise default to bottom
    el.scrollTop = typeof saved === 'number' ? saved : el.scrollHeight;

    // Compute whether we're "near bottom" after restore
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = dist <= BOTTOM_THRESHOLD;
  }, [threadId]);

  // Auto-scroll on new messages only if user is near bottom
  useEffect(() => {
    if (!threadId) return;
    const el = messagesRef.current;
    if (!el) return;
    if (!stickToBottomRef.current) return;

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [threadId, msgLen]);

  // React onScroll handler for the scroll container
  const handleMessagesScroll = () => {
    const el = messagesRef.current;
    if (!el || !threadId) return;

    scrollPosByThreadRef.current[threadId] = el.scrollTop;

    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = dist <= BOTTOM_THRESHOLD;
  };

  const handleStatusChange = (value: 'open' | 'waiting' | 'closed') => {
    if (!thread) return;
    if (value === 'open') onReopen();
    else if (value === 'waiting') onMarkWaiting();
    else onClose();
  };

  const handleInsertDraftClick = (messageId: string, content: string) => {
    onInsertDraft(content);
    setHiddenDraftIds((prev) => [...prev, messageId]);
  };

  if (hidden) return <div className="cx-pane cx-threadPane is-hidden" />;

  if (!thread) {
    return (
      <div className="cx-pane cx-threadPane">
        <div className="cx-emptyThread">Select a conversation to view the thread.</div>
      </div>
    );
  }

  // ✅ archivedAt section (safe + explicit)
  const archivedAt = thread.archivedAt ?? null;
  const showArchive = !archivedAt;
  const statusValue = thread.status;

  return (
    <div className="cx-pane cx-threadPane">
      <div className="cx-thread">
        {/* Sticky header */}
        <div className="cx-threadHeader">
          <div className="cx-threadHeaderMain">
            <div className="cx-threadTitleRow">
              <div className="cx-threadCustomer">
                {(() => {
                  const [name, rest] = thread.customerName.split(' · ');
                  return (
                    <>
                      <strong className="cx-threadName">{name}</strong>
                      {rest ? <span className="cx-threadRest"> · {rest}</span> : null}
                    </>
                  );
                })()}
              </div>

              <div className="cx-threadTitlePills">
                <span className="cx-pill">{thread.channel || 'Web shopper'}</span>
              </div>
            </div>

            <div className="cx-threadSubject">{thread.subject}</div>
            <div className="cx-threadMetaRow" />
          </div>

          <div className="cx-threadHeaderActions">
            <button type="button" className="cx-btn-small" onClick={onAddNote}>
              Add note
            </button>

            <select
              className="cx-statusSelect cx-btn-small"
              value={statusValue}
              onChange={(e) => handleStatusChange(e.target.value as 'open' | 'waiting' | 'closed')}
              aria-label="Conversation status"
              title="Conversation status"
            >
              <option value="open">Open</option>
              <option value="waiting">Waiting</option>
              <option value="closed">Closed</option>
            </select>

            {thread.aiEnabled && <span className="cx-pill cx-pill-muted cx-aiPill">AI answering</span>}

            {showArchive ? (
              <button type="button" className="cx-btn-small" onClick={onArchive}>
                Archive
              </button>
            ) : (
              <button type="button" className="cx-btn-small" onClick={onRestore}>
                Restore
              </button>
            )}
          </div>
        </div>

        {/* Tags row (hidden by CSS, kept intact) */}
        <div className="cx-tagRow">
          <div className="cx-tagList">
            {thread.tags?.map((t) => (
              <span key={t} className="cx-chip">
                <span>{t}</span>
                <button type="button" onClick={() => onRemoveTag(t)} aria-label={`Remove ${t}`}>
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="cx-tagEditor">
            <span className="cx-tagLabel">Add tag:</span>
            <input
              className="cx-tagInput"
              value={tagDraft}
              onChange={(e) => onTagDraftChange(e.target.value)}
              placeholder="Returns, VIP, delayed, ..."
            />
            <button type="button" className="cx-btn-small" onClick={onAddTag}>
              Add
            </button>
          </div>
        </div>

        {/* Messages (scroll container) */}
        <div className="cx-messages" ref={messagesRef} onScroll={handleMessagesScroll}>
          {thread.messages.map((m) => {
            const isStaff = m.role === 'staff';
            const isNote = m.role === 'note';
            const draftNote = isNote && isDraftNote(m.content);

            if (draftNote && hiddenDraftIds.includes(m.id)) return null;

            return (
              <div key={m.id} className="cx-messageBlock">
                <div className="cx-msgMeta">
                  <span className="cx-msgAuthor">{roleLabel(m.role)}</span> <span>· {fmtTime(m.createdAt)}</span>
                </div>

                <div
                  className={['cx-msgBubble', isStaff ? 'is-staff' : '', isNote ? 'is-note' : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="cx-msgText">{m.content}</div>

                  {draftNote && (
                    <div className="cx-draftActions">
                      <button
                        type="button"
                        className="cx-btn-small"
                        onClick={() => handleInsertDraftClick(m.id, m.content)}
                      >
                        Insert draft
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {!thread.messages?.length && <div className="cx-emptyThread">No messages yet.</div>}
        </div>

        {/* Reply composer */}
        <div className="cx-replyBox">
          <div className="cx-replyTopRow">
            <span className="cx-replyLabel">
              Reply as <strong>{staffName}</strong>
            </span>

            <div className="cx-replyTopActions">
              {thread.aiEnabled ? (
                <button type="button" className="cx-btn-small" onClick={onTakeOver}>
                  Take over this call
                </button>
              ) : (
                <button type="button" className="cx-btn-small" onClick={onResumeAi}>
                  Resume AI (this chat)
                </button>
              )}

              <button type="button" className="cx-btn-small" onClick={onGenerateDraft}>
                Generate draft
              </button>
            </div>
          </div>

          <textarea
            ref={replyRef}
            className="cx-textarea"
            rows={4}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={`Type your reply as ${staffName}…`}
          />

          <div className="cx-replyActions">
            <button type="button" className="cx-btn-primary" onClick={onSendReply}>
              Send
            </button>
          </div>

          <div className="cx-replyHint">
            Drafts appear as internal notes. Use <strong>Generate draft</strong>, then <strong>Insert draft</strong> to pull
            them into this box.
          </div>
        </div>
      </div>
    </div>
  );
}
