// src/app/admin/tiko/TikoAdminClient.tsx

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';


type TikoLearningItem = {
  id: string;
  instruction: string;
  summary?: string | null;
  source: string;

appliesText: boolean;
appliesVoice: boolean;
appliesTikoWeb: boolean;
appliesTikoDash: boolean;
appliesAssistants: boolean;

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
  const [noteText, setNoteText] = useState(true);
  const [noteVoice, setNoteVoice] = useState(true);

  const [noteTikoWeb, setNoteTikoWeb] = useState(true);
  const [noteTikoDash, setNoteTikoDash] = useState(true);
  const [noteAssistants, setNoteAssistants] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type TikoTestContext =
  | 'marketing'
  | 'dashboard';

const [messages, setMessages] = useState<ChatMessage[]>([]);
const [question, setQuestion] = useState('');
const [sendingQuestion, setSendingQuestion] = useState(false);

const [testContext, setTestContext] =
  useState<TikoTestContext>('marketing');
  const [coachingMessageIndex, setCoachingMessageIndex] =
  useState<number | null>(null);

const [coachingText, setCoachingText] =
  useState('');

const [savingCoaching, setSavingCoaching] =
  useState(false);

const [coachingReply, setCoachingReply] =
  useState('');
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

  appliesText: noteText,
  appliesVoice: noteVoice,

  appliesTikoWeb: noteTikoWeb,
  appliesTikoDash: noteTikoDash,
  appliesAssistants: noteAssistants,
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

async function saveTestCoaching() {
  const instruction =
    coachingText.trim();

  if (
    !instruction ||
    savingCoaching ||
    coachingMessageIndex === null
  ) {
    return;
  }

  setSavingCoaching(true);
  setError('');
  setCoachingReply('');

  try {
    const res = await fetch(
      '/api/admin/tiko/learning',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
body: JSON.stringify({
  instruction,

  appliesText: true,
  appliesVoice: false,

  appliesTikoWeb:
    testContext === 'marketing',

  appliesTikoDash:
    testContext === 'dashboard',

  appliesAssistants: false,

  fromTestCoach: true,
}),
      }
    );

    const data =
      await res.json().catch(() => null);

    if (
      !res.ok ||
      !data?.ok ||
      !data?.item
    ) {
      throw new Error(
        data?.error ||
          'Could not save Tiko coaching.'
      );
    }

    setItems((current) => [
      data.item,
      ...current,
    ]);

    if (data?.reply) {
      setCoachingReply(
        String(data.reply)
      );
    }

    setCoachingText('');
  } catch (err: any) {
    setError(
      err?.message ||
        'Could not save Tiko coaching.'
    );
  } finally {
    setSavingCoaching(false);
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

  const nextMessages = [
    ...messages,
    userMessage,
  ];

  setMessages(nextMessages);
  setQuestion('');

  try {
    const res = await fetch(
      '/api/admin/tiko/test',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: testContext,
          history: messages,
        }),
      }
    );

    const data =
      await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      throw new Error(
        data?.error ||
          'Could not test Tiko.'
      );
    }

    setMessages([
      ...nextMessages,
      {
        role: 'assistant',
        content: String(
          data.answer || ''
        ).trim(),
      },
    ]);
  } catch (err: any) {
    setMessages([
      ...nextMessages,
      {
        role: 'assistant',
        content:
          err?.message ||
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
  setCoachingMessageIndex(null);
  setCoachingText('');
  setCoachingReply('');
}}
      >
        Start over
      </button>
    ) : null}
  </div>

<div className="tikoTestContext">
  <span className="tikoTestContextLabel">
    Test Tiko as:
  </span>

  <div className="tikoTestContextOptions">
    <button
      type="button"
      className={
        testContext === 'marketing'
          ? 'active'
          : ''
      }
      disabled={sendingQuestion}
      onClick={() => {
        if (testContext === 'marketing') {
          return;
        }

        setTestContext('marketing');
        setMessages([]);
        setQuestion('');
        setCoachingMessageIndex(null);
        setCoachingText('');
        setCoachingReply('');
      }}
    >
      Website
    </button>

    <button
      type="button"
      className={
        testContext === 'dashboard'
          ? 'active'
          : ''
      }
      disabled={sendingQuestion}
      onClick={() => {
        if (testContext === 'dashboard') {
          return;
        }

        setTestContext('dashboard');
        setMessages([]);
        setQuestion('');
        setCoachingMessageIndex(null);
        setCoachingText('');
        setCoachingReply('');
      }}
    >
      Dashboard
    </button>
  </div>
</div>

  <div className="tikoConversation">
    {messages.length === 0 ? (
      <div className="tikoConversationEmpty">
        <div className="tikoPlaceholderIcon" aria-hidden="true">
          💬
        </div>

        <strong>Start a conversation with Tiko</strong>

<span>
  {testContext === 'dashboard'
    ? 'Ask how to use Overview, Inbox, Assistant, Knowledge, Widget, Starter Link, Billing, Settings, or what a merchant should do next.'
    : 'Ask about TikoZap, pricing, setup, Starter Link, Voice, or anything a website visitor may ask.'}
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

        {!isUser ? (
          <>
            <div className="tikoMessageCoach">
              <button
                type="button"
                onClick={() => {
                  setCoachingMessageIndex(index);
                  setCoachingText('');
                  setCoachingReply('');
                }}
              >
                Coach
              </button>
            </div>

            {coachingMessageIndex === index ? (
              <div className="tikoCoachBox">
                <div className="tikoCoachBoxHead">
                  <strong>Coach Tiko</strong>

                  <button
                    type="button"
                    className="tikoCoachClose"
                    aria-label="Close coaching"
                    onClick={() => {
                      setCoachingMessageIndex(null);
                      setCoachingText('');
                      setCoachingReply('');
                    }}
                  >
                    ×
                  </button>
                </div>

                <p>
                  Tell Tiko what he should understand or do
                  differently next time.
                </p>

                <textarea
                  value={coachingText}
                  onChange={(e) =>
                    setCoachingText(e.target.value)
                  }
                  placeholder="What should Tiko learn from this answer?"
                  rows={3}
                  disabled={savingCoaching}
                />

                {coachingReply ? (
                  <div className="tikoNoted">
                    {coachingReply}
                  </div>
                ) : null}

                <div className="tikoCoachActions">
                  <span>
                    Applies to:{' '}
                    <strong>
                      {testContext === 'dashboard'
                        ? 'Dashboard'
                        : 'Website'}
                    </strong>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      void saveTestCoaching()
                    }
                    disabled={
                      !coachingText.trim() ||
                      savingCoaching
                    }
                  >
                    {savingCoaching
                      ? 'Saving…'
                      : 'Save coaching'}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
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
  <h3>Teach</h3>

  <p>
    Choose where this learning should apply.
  </p>
</div>

<div className="tikoTeachScope">
  <div className="tikoTeachScopeRow">
    <label>
      <input
        type="checkbox"
        checked={noteText}
        onChange={(e) =>
          setNoteText(e.target.checked)
        }
      />
      Text
    </label>

    <label>
      <input
        type="checkbox"
        checked={noteVoice}
        onChange={(e) =>
          setNoteVoice(e.target.checked)
        }
      />
      Voice
    </label>
  </div>

  <div className="tikoTeachScopeRow">
    <label>
      <input
        type="checkbox"
        checked={noteTikoWeb}
        onChange={(e) =>
          setNoteTikoWeb(e.target.checked)
        }
      />
      Tiko (W)
    </label>

    <label>
      <input
        type="checkbox"
        checked={noteTikoDash}
        onChange={(e) =>
          setNoteTikoDash(e.target.checked)
        }
      />
      Tiko (D)
    </label>

    <label>
      <input
        type="checkbox"
        checked={noteAssistants}
        onChange={(e) =>
          setNoteAssistants(e.target.checked)
        }
      />
      Assistants
    </label>
  </div>
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
  disabled={
    !newNote.trim() ||
    saving ||
    (!noteText && !noteVoice) ||
    (!noteTikoWeb &&
      !noteTikoDash &&
      !noteAssistants)
  }
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
  <span>
    {[
      item.appliesTikoWeb ? 'Tiko (W)' : '',
      item.appliesTikoDash ? 'Tiko (D)' : '',
      item.appliesAssistants ? 'Assistants' : '',
    ]
      .filter(Boolean)
      .join(' / ')}
  </span>

  <span>
    {[
      item.appliesText ? 'Text' : '',
      item.appliesVoice ? 'Voice' : '',
    ]
      .filter(Boolean)
      .join(' / ')}
  </span>

  <span>
    {formatDateTime(item.updatedAt)}
  </span>
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

        .tikoTeachScope {
  display: grid;
  gap: 8px;
  margin: 12px 0;
}

.tikoTeachScopeRow {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.tikoTeachScopeRow label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}

.tikoTeachScopeRow input {
  margin: 0;
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
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 7px;
  color: #64748b;
  font-size: 12px;
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

.tikoTestContext {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 16px;
}

.tikoTestContextLabel {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.tikoTestContextOptions {
  display: inline-flex;
  padding: 3px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #f8fafc;
}

.tikoTestContextOptions button {
  border: 0;
  border-radius: 9px;
  padding: 7px 12px;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.tikoTestContextOptions button.active {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
}

.tikoTestContextOptions button:disabled {
  cursor: default;
  opacity: 0.6;
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

        .tikoMessageCoach {
  margin-top: 6px;
}

.tikoMessageCoach button {
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 0;
  cursor: pointer;
}

.tikoMessageCoach button:hover {
  color: #111827;
}

.tikoCoachBox {
  margin-top: 8px;
  padding: 12px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #ffffff;
}

.tikoCoachBoxHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tikoCoachBoxHead strong {
  font-size: 13px;
  color: #111827;
}

.tikoCoachClose {
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 20px;
  cursor: pointer;
}

.tikoCoachBox p {
  margin: 5px 0 10px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.tikoCoachBox textarea {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  min-height: 74px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 9px 10px;
  font: inherit;
  font-size: 13px;
}

.tikoCoachActions {
  margin-top: 9px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tikoCoachActions span {
  color: #64748b;
  font-size: 12px;
}

.tikoCoachActions button {
  border: 0;
  border-radius: 9px;
  padding: 8px 11px;
  background: #111827;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.tikoCoachActions button:disabled {
  opacity: 0.45;
  cursor: default;
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