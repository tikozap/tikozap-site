// src/app/admin/tiko/TikoAdminClient.tsx

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';


type TikoLearningItem = {
  id: string;
  instruction: string;
  summary?: string | null;
  source: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TikoAdminClient() {
  const [items, setItems] = useState<TikoLearningItem[]>([]);
  const [search, setSearch] = useState('');
  const [newNote, setNewNote] = useState('');
  const [notedReply, setNotedReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const [messages, setMessages] = useState<ChatMessage[]>([]);
const [question, setQuestion] = useState('');
const [sendingQuestion, setSendingQuestion] = useState(false);
const [conversationId, setConversationId] = useState<string | null>(null);
const NOTES_STEP = 5;
const [visibleNoteCount, setVisibleNoteCount] = useState(NOTES_STEP);

const messagesEndRef = useRef<HTMLDivElement | null>(null);

  async function loadItems() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/tiko/learning', {
        cache: 'no-store',
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error || 'Could not load Tiko notebook.',
        );
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err: any) {
      setError(
        err?.message || 'Could not load Tiko notebook.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  setVisibleNoteCount(NOTES_STEP);
}, [search]);

  useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  });
}, [messages, sendingQuestion]);

  useEffect(() => {
    void loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      [
        item.instruction,
        item.summary || '',
        item.source,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [items, search]);

  const visibleItems = filteredItems.slice(
  0,
  visibleNoteCount
);

const hasMoreNotes =
  visibleNoteCount < filteredItems.length;

const showingMoreThanDefault =
  visibleNoteCount > NOTES_STEP;

  async function addNote() {
    const instruction = newNote.trim();

    if (!instruction || saving) return;

    setSaving(true);
    setError('');
    setNotedReply('');

    try {
      const res = await fetch('/api/admin/tiko/learning', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          instruction,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok || !data?.item) {
        throw new Error(
          data?.error || 'Could not save Tiko coaching.',
        );
      }

      setItems((current) => [
        data.item,
        ...current,
      ]);

if (data?.reply) {
  setNotedReply(String(data.reply));
}

      setNewNote('');
    } catch (err: any) {
      setError(
        err?.message || 'Could not save Tiko coaching.',
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item: TikoLearningItem) {
    setEditingId(item.id);
    setEditingText(item.instruction);
    setError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingText('');
  }

  async function saveEdit(id: string) {
    const instruction = editingText.trim();

    if (!instruction || saving) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/tiko/learning', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          id,
          instruction,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok || !data?.item) {
        throw new Error(
          data?.error || 'Could not update Tiko note.',
        );
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id ? data.item : item,
        ),
      );

      cancelEditing();
    } catch (err: any) {
      setError(
        err?.message || 'Could not update Tiko note.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(id: string) {
    const confirmed = window.confirm(
      'Remove this note from Tiko’s active notebook?',
    );

    if (!confirmed || saving) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/tiko/learning', {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          id,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error || 'Could not remove Tiko note.',
        );
      }

      setItems((current) =>
        current.filter((item) => item.id !== id),
      );
    } catch (err: any) {
      setError(
        err?.message || 'Could not remove Tiko note.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function askTiko() {
  const message = question.trim();

  if (!message || sendingQuestion) return;

  setSendingQuestion(true);

  const userMessage: ChatMessage = {
    role: 'user',
    content: message,
  };

  const history = [...messages, userMessage];

  setMessages(history);
  setQuestion('');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
body: JSON.stringify({
  message,
  conversationId,
  mode: 'marketing',
}),
    });

    const reader = res.body?.getReader();

    if (!reader) {
      throw new Error('No response.');
    }

    const decoder = new TextDecoder();

    let answer = '';
    let nextConversationId = conversationId;

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      const text = decoder.decode(value);

      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue;

        try {
          const evt = JSON.parse(line.slice(6));

          if (
            evt.type === 'meta' &&
            evt.conversationId
          ) {
            nextConversationId =
              evt.conversationId;
          }

if (
  evt.type === 'delta' &&
  evt.delta
) {
  answer += evt.delta;
}
        } catch {}
      }
    }

    setConversationId(nextConversationId);

    setMessages([
      ...history,
      {
        role: 'assistant',
        content: answer.trim(),
      },
    ]);
  } catch {
    setMessages([
      ...history,
      {
        role: 'assistant',
        content:
          'Sorry, something went wrong.',
      },
    ]);
  } finally {
    setSendingQuestion(false);
  }
}

  return (
    <main className="tikoAdminPage">
      <div className="tikoAdminShell">
        <div className="tikoAdminTop">
          <div>
            <p className="tikoEyebrow">
              TikoZap Internal
            </p>

            <h1>Tiko</h1>

            <p className="tikoSub">
              Test, coach, and improve Tiko over time.
            </p>
          </div>

          <Link
            href="/admin"
            className="tikoBack"
          >
            ← Admin Console
          </Link>
        </div>

<section className="tikoCard">
  <div className="tikoCardHead">
    <div>
      <h2>Test & Coach</h2>

      <p>
        Ask Tiko anything about TikoZap and review his answer.
      </p>
    </div>

    {messages.length > 0 ? (
      <button
        type="button"
        className="tikoStartOver"
        disabled={sendingQuestion}
        onClick={() => {
          setMessages([]);
          setQuestion('');
          setConversationId(null);
        }}
      >
        Start over
      </button>
    ) : null}
  </div>

  <div className="tikoConversation">
    {messages.length === 0 ? (
      <div className="tikoConversationEmpty">
        <div className="tikoPlaceholderIcon" aria-hidden="true">
          💬
        </div>

        <strong>Start a conversation with Tiko</strong>

        <span>
          Ask about TikoZap, pricing, setup, Starter Link,
          Voice, or anything Tiko should know.
        </span>
      </div>
    ) : (
      messages.map((message, index) => {
        const isUser = message.role === 'user';

        return (
          <div
            key={`${message.role}-${index}`}
            className={[
              'tikoMessageRow',
              isUser ? 'is-user' : 'is-tiko',
            ].join(' ')}
          >
            <div className="tikoMessageWrap">
              <div className="tikoMessageLabel">
                {isUser ? 'You' : 'Tiko'}
              </div>

              <div
                className={[
                  'tikoMessageBubble',
                  isUser ? 'is-user' : 'is-tiko',
                ].join(' ')}
              >
                {message.content}
              </div>
            </div>
          </div>
        );
      })
    )}

    {sendingQuestion ? (
      <div className="tikoMessageRow is-tiko">
        <div className="tikoMessageWrap">
          <div className="tikoMessageLabel">
            Tiko
          </div>

          <div className="tikoMessageBubble is-tiko tikoThinking">
            Thinking…
          </div>
        </div>
      </div>
    ) : null}

  <div ref={messagesEndRef} />
  </div>

  <div className="tikoAsk">
    <textarea
      value={question}
      onChange={(e) => setQuestion(e.target.value)}
      placeholder="Ask Tiko..."
      rows={3}
      disabled={sendingQuestion}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          void askTiko();
        }
      }}
    />

    <div className="tikoAskActions">
      <span>
        Enter to send · Shift + Enter for a new line
      </span>

      <button
        type="button"
        onClick={() => void askTiko()}
        disabled={!question.trim() || sendingQuestion}
      >
        {sendingQuestion ? 'Sending…' : 'Send'}
      </button>
    </div>
  </div>
</section>

        <section className="tikoCard">
          <div className="tikoCardHead">
            <div>
              <h2>Tiko&apos;s Notebook</h2>

              <p>
                Everything Tiko has permanently learned from your coaching.
              </p>
            </div>

            <span className="tikoCount">
              {items.length} {items.length === 1 ? 'note' : 'notes'}
            </span>
          </div>

          <div className="tikoSearch">
            <span aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Tiko's notebook..."
            />
          </div>

          <div className="tikoTeach">
            <div>
              <h3>Coach Tiko</h3>

              <p>
                Add something Tiko should remember for future conversations.
              </p>
            </div>

            <textarea
              value={newNote}
              onChange={(e) => {
                setNewNote(e.target.value);
                setNotedReply('');
           }}
              placeholder="What should Tiko remember?"
              rows={4}
            />

          {notedReply ? (
            <div className="tikoNoted">
              {notedReply}
            </div>
          ) : null}

            <div className="tikoTeachActions">
              {newNote ? (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                   setNewNote('');
                   setNotedReply('');
                 }}
                  disabled={saving}
                >
                  Clear
                </button>
              ) : null}

              <button
                type="button"
                onClick={addNote}
                disabled={!newNote.trim() || saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

{!loading && filteredItems.length > 0 ? (
  <div className="tikoLearningHeading">
    Latest learning
  </div>
) : null}

          {error ? (
            <div className="tikoError">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="tikoPlaceholder">
              <div className="tikoPlaceholderIcon">
                📓
              </div>

              <strong>Opening notebook…</strong>
            </div>
          ) : null}

          {!loading && items.length === 0 ? (
            <div className="tikoPlaceholder">
              <div className="tikoPlaceholderIcon">
                📓
              </div>

              <strong>Tiko&apos;s notebook is empty.</strong>

              <span>
                Coaching notes will appear here.
              </span>
            </div>
          ) : null}

          {!loading &&
          items.length > 0 &&
          filteredItems.length === 0 ? (
            <div className="tikoPlaceholder">
              <strong>No matching notes.</strong>

              <span>
                Try a different keyword.
              </span>
            </div>
          ) : null}

          {!loading && filteredItems.length > 0 ? (
            <div className="tikoNotes">
              {visibleItems.map((item) => {
                const editing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="tikoNote"
                  >
                    <div className="tikoNoteMeta">
                      {formatDateTime(item.updatedAt)}
                      {' · '}
                      Coach Tiko
                    </div>

                    {editing ? (
                      <>
                        <textarea
                          value={editingText}
                          onChange={(e) =>
                            setEditingText(e.target.value)
                          }
                          rows={4}
                          autoFocus
                        />

                        <div className="tikoNoteActions">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={saving}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            className="isPrimary"
                            onClick={() => saveEdit(item.id)}
                            disabled={
                              !editingText.trim() || saving
                            }
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="tikoNoteText">
                          {item.instruction}
                        </p>

                        <div className="tikoNoteActions">
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="isDelete"
                            onClick={() => deleteNote(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {!loading &&
filteredItems.length > NOTES_STEP ? (
  <div className="tikoRevealActions">
    {hasMoreNotes ? (
      <button
        type="button"
        onClick={() =>
          setVisibleNoteCount((current) =>
            Math.min(
              current + NOTES_STEP,
              filteredItems.length
            )
          )
        }
      >
        Show 5 more
      </button>
    ) : null}

    {showingMoreThanDefault ? (
      <button
        type="button"
        onClick={() =>
          setVisibleNoteCount(NOTES_STEP)
        }
      >
        Show fewer
      </button>
    ) : null}
  </div>
) : null}
        </section>
      </div>

      <style>{`
        .tikoAdminPage {
          min-height: 100vh;
          box-sizing: border-box;
          padding: 40px 24px;
          background: #f8fafc;
          color: #111827;
        }

        .tikoAdminShell {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          display: grid;
          gap: 18px;
        }

        .tikoAdminTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .tikoEyebrow {
          margin: 0 0 8px;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .tikoAdminTop h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.15;
          letter-spacing: -0.03em;
        }

        .tikoSub {
          margin: 9px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .tikoBack {
          flex: 0 0 auto;
          color: #475569;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
        }

        .tikoBack:hover {
          color: #111827;
        }

        .tikoCard {
          display: grid;
          gap: 16px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }

        .tikoCardHead {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .tikoCardHead h2,
        .tikoTeach h3 {
          margin: 0;
          color: #111827;
        }

        .tikoCardHead h2 {
          font-size: 19px;
        }

        .tikoTeach h3 {
          font-size: 16px;
        }

        .tikoCardHead p,
        .tikoTeach p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.55;
        }

        .tikoCount {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 0 10px;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          background: #f8fafc;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .tikoSearch {
          position: relative;
        }

        .tikoSearch span {
          position: absolute;
          top: 50%;
          left: 14px;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .tikoSearch input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 14px;
          background: #ffffff;
          padding: 12px 14px 12px 40px;
          color: #111827;
          font-size: 14px;
          outline: none;
        }

        .tikoPlaceholder {
          min-height: 150px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 7px;
          padding: 20px;
          border: 1px dashed #d1d5db;
          border-radius: 16px;
          background: #f8fafc;
          text-align: center;
        }

        .tikoPlaceholderIcon {
          font-size: 24px;
        }

        .tikoPlaceholder strong {
          font-size: 14px;
        }

        .tikoPlaceholder span {
          color: #94a3b8;
          font-size: 12px;
        }

        .tikoNotes {
          display: grid;
          gap: 10px;
        }

        .tikoNote {
          padding: 15px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #ffffff;
        }

        .tikoNoteMeta {
          margin-bottom: 7px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 500;
        }

        .tikoNoteText {
          margin: 0;
          color: #1f2937;
          font-size: 14px;
          line-height: 1.65;
          white-space: pre-wrap;
        }

        .tikoNote textarea,
        .tikoTeach textarea {
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
          border: 1px solid #d1d5db;
          border-radius: 14px;
          padding: 12px 14px;
          background: #ffffff;
          color: #111827;
          font: inherit;
          font-size: 14px;
          line-height: 1.55;
          outline: none;
        }

        .tikoNoteActions,
        .tikoTeachActions {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          margin-top: 10px;
        }

        .tikoNoteActions button {
          border: none;
          background: transparent;
          color: #64748b;
          border-radius: 8px;
          padding: 5px 8px;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
        }

        .tikoNoteActions button.isPrimary {
          background: #111827;
          color: #ffffff;
        }

        .tikoNoteActions button.isDelete:hover {
          background: #fef2f2;
          color: #b91c1c;
        }

        .tikoTeach {
          display: grid;
          gap: 12px;
          padding-top: 4px;
        }

        .tikoTeachActions button {
          border: none;
          border-radius: 12px;
          background: #111827;
          color: #ffffff;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .tikoTeachActions button.secondary {
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #475569;
        }

        .tikoTeachActions button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .tikoError {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #991b1b;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
        }

        .tikoStartOver {
  flex: 0 0 auto;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  color: #475569;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
}

.tikoStartOver:disabled {
  opacity: 0.5;
  cursor: default;
}

.tikoConversation {
  height: 360px;
  overflow-y: auto;
  overscroll-behavior: contain;
  box-sizing: border-box;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #f8fafc;
}

.tikoConversationEmpty {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  text-align: center;
}

.tikoConversationEmpty strong {
  margin-top: 5px;
  color: #111827;
  font-size: 14px;
}

.tikoConversationEmpty span {
  max-width: 430px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.55;
}

.tikoMessageRow {
  display: flex;
  margin-bottom: 15px;
}

.tikoMessageRow.is-user {
  justify-content: flex-end;
}

.tikoMessageRow.is-tiko {
  justify-content: flex-start;
}

.tikoMessageWrap {
  width: min(78%, 650px);
}

.tikoMessageLabel {
  margin-bottom: 5px;
  color: #64748b;
  font-size: 11px;
  font-weight: 750;
}

.tikoMessageRow.is-user .tikoMessageLabel {
  text-align: right;
}

.tikoMessageBubble {
  border-radius: 15px;
  padding: 11px 13px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.tikoMessageBubble.is-user {
  border: 1px solid #111827;
  background: #111827;
  color: #ffffff;
}

.tikoMessageBubble.is-tiko {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #111827;
}

.tikoThinking {
  color: #64748b;
}

.tikoAsk {
  display: grid;
  gap: 10px;
}

.tikoAsk textarea {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  border: 1px solid #d1d5db;
  border-radius: 14px;
  background: #ffffff;
  padding: 12px 14px;
  color: #111827;
  font: inherit;
  font-size: 14px;
  line-height: 1.55;
  outline: none;
}

.tikoAsk textarea:focus {
  border-color: #94a3b8;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.14);
}

.tikoAskActions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.tikoAskActions span {
  color: #94a3b8;
  font-size: 11px;
}

.tikoAskActions button {
  border: none;
  border-radius: 12px;
  background: #111827;
  color: #ffffff;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.tikoAskActions button:disabled {
  opacity: 0.55;
  cursor: default;
}

.tikoLearningHeading {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.tikoRevealActions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 2px;
}

.tikoRevealActions button {
  border: none;
  background: transparent;
  color: #475569;
  padding: 7px 9px;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
}

.tikoRevealActions button:hover {
  color: #111827;
  text-decoration: underline;
}

        @media (max-width: 700px) {
          .tikoAdminPage {
            padding: 28px 16px;
          }

          .tikoAdminTop {
            flex-direction: column;
          }

          .tikoBack {
            order: -1;
          }

          .tikoConversation {
  height: 340px;
  padding: 14px 12px;
}

.tikoMessageWrap {
  width: 88%;
}

.tikoAskActions span {
  display: none;
}

.tikoAskActions {
  justify-content: flex-end;
}
        }
      `}</style>
    </main>
  );
}