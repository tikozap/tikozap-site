// src/app/dashboard/assistant/memory/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';

import AssistantSectionMenu from '../_components/AssistantSectionMenu';
import MobilePageHeader from '../../_components/MobilePageHeader';
import { useAssistantIdentity } from '../_components/useAssistantIdentity';

type MemoryItem = {
  id: string;
  instruction: string;
  summary?: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
  conversationId?: string | null;
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

function sourceLabel(source: string) {
  if (source === 'manual_memory') {
    return 'Added manually';
  }

  if (source === 'merchant_coaching') {
    return 'Coaching';
  }

  return 'Memory';
}

export default function MemoryPage() {
  const { assistantName } = useAssistantIdentity();

  const safeAssistantName =
    String(assistantName || '').trim() || 'Your assistant';

  const [items, setItems] = useState<MemoryItem[]>([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [saving, setSaving] = useState(false);
  const NOTES_STEP = 5;

  const [visibleNoteCount, setVisibleNoteCount] =
  useState(NOTES_STEP);

  async function loadMemory() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/assistant/memory', {
        cache: 'no-store',
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error || 'Could not load notebook.',
        );
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err: any) {
      setError(
        err?.message || 'Could not load notebook.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMemory();
  }, []);

  useEffect(() => {
  setVisibleNoteCount(NOTES_STEP);
  }, [search]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => {
      const text = [
        item.instruction,
        item.summary || '',
        sourceLabel(item.source),
      ]
        .join(' ')
        .toLowerCase();

      return text.includes(query);
    });
  }, [items, search]);

  const visibleItems = filteredItems.slice(
  0,
  visibleNoteCount
);

const hasMoreNotes =
  visibleNoteCount < filteredItems.length;

const showingMoreThanDefault =
  visibleNoteCount > NOTES_STEP;



  function startEditing(item: MemoryItem) {
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
      const res = await fetch('/api/assistant/memory', {
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
          data?.error || 'Could not update note.',
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
        err?.message || 'Could not update note.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(id: string) {
    const confirmed = window.confirm(
      'Remove this note from your assistant’s memory?',
    );

    if (!confirmed || saving) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/assistant/memory', {
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
          data?.error || 'Could not remove note.',
        );
      }

      setItems((current) =>
        current.filter((item) => item.id !== id),
      );
    } catch (err: any) {
      setError(
        err?.message || 'Could not remove note.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="db-container">
      <MobilePageHeader
        title="Memory"
        rightAction={<AssistantSectionMenu />}
      />

      <div className="db-pageStack mem-page">
<div className="assistant-sectionPageHeader">
  <div>
    <h1 className="db-title">
      {safeAssistantName}&apos;s Notebook
    </h1>

    <p className="db-sub">
      Everything {safeAssistantName} has permanently learned
      from your coaching.
    </p>
  </div>

  <div className="mem-headerRight">
    <span className="mem-count">
      {items.length} {items.length === 1 ? 'note' : 'notes'}
    </span>

    <div className="assistant-sectionDesktopSwitcher">
      <AssistantSectionMenu />
    </div>
  </div>
</div>

<section className="mem-toolbar">
  <div className="mem-searchWrap">
    <span
      className="mem-searchIcon"
      aria-hidden="true"
    >
      ⌕
    </span>

    <input
      type="search"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder={`Search ${safeAssistantName}'s notebook...`}
      aria-label="Search notebook"
    />
  </div>
</section>



{!loading && filteredItems.length > 0 ? (
  <div className="mem-learningHeading">
    {search.trim() ? 'Search results' : 'Latest learning'}
  </div>
) : null}

        {error ? (
          <div className="mem-error">{error}</div>
        ) : null}

        {loading ? (
          <section className="mem-empty">
            <div className="mem-emptyIcon">📓</div>
            <h2>Opening notebook…</h2>
          </section>
        ) : null}

        {!loading && items.length === 0 ? (
          <section className="mem-empty">
            <div className="mem-emptyIcon">📓</div>

<h2>
  {safeAssistantName}&apos;s notebook is empty.
</h2>

<p>
  Coach {safeAssistantName} in Test &amp; Coach or while
  reviewing customer conversations. Learned notes will
  appear here automatically.
</p>
          </section>
        ) : null}

        {!loading &&
        items.length > 0 &&
        filteredItems.length === 0 ? (
          <section className="mem-empty">
            <h2>No matching notes</h2>
            <p>
              Try a different keyword.
            </p>
          </section>
        ) : null}

        {!loading && filteredItems.length > 0 ? (
          <div className="mem-list">
            {visibleItems.map((item) => {
              const editing = editingId === item.id;

              return (
                <section
                  key={item.id}
                  className="mem-note"
                >
                  <div className="mem-noteMeta">
                    {formatDateTime(item.createdAt)}
                    {' · '}
                    {sourceLabel(item.source)}
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

                      <div className="mem-noteActions">
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={saving}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="is-primary"
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
                      <p className="mem-noteText">
                        {item.instruction}
                      </p>

                      <div className="mem-noteActions">
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="is-delete"
                          onClick={() => deleteNote(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </section>
              );
            })}
          </div>
        ) : null}

       {!loading &&
filteredItems.length > NOTES_STEP ? (
  <div className="mem-revealActions">
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
        {`Show ${Math.min(
  NOTES_STEP,
  filteredItems.length - visibleNoteCount
)} more`}
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
      </div>

<style jsx>{`
  .mem-page {
    max-width: 780px;
    margin: 0 auto;
  }

  .assistant-sectionPageHeader {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .assistant-sectionDesktopSwitcher {
    flex: 0 0 auto;
  }

  .mem-toolbar {
    display: block;
  }

  .mem-searchWrap {
    position: relative;
  }

  .mem-searchIcon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 18px;
    pointer-events: none;
  }

  .mem-searchWrap input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #d1d5db;
    background: #ffffff;
    border-radius: 14px;
    padding: 12px 14px 12px 40px;
    color: #111827;
    font-size: 14px;
    outline: none;
  }

  .mem-searchWrap input:focus {
    border-color: #94a3b8;
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.14);
  }

  .mem-note,
  .mem-empty {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
  }

  .mem-empty h2 {
    margin: 0;
    color: #111827;
    font-size: 17px;
  }

  .mem-empty p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.55;
  }

  .mem-note textarea {
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
    line-height: 1.6;
    outline: none;
  }

  .mem-note textarea:focus {
    border-color: #94a3b8;
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.14);
  }

.mem-list {
  display: grid;
  gap: 6px;
}

.mem-note {
  padding: 10px 12px;
  border-radius: 12px;
  box-shadow: none;
}

.mem-noteMeta {
  margin-bottom: 4px;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.3;
}

.mem-noteText {
  margin: 0;
  color: #1f2937;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.mem-noteActions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
}

.mem-noteActions button {
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 11px;
  font-weight: 750;
  cursor: pointer;
}

  .mem-noteActions button:hover {
    background: #f8fafc;
    color: #111827;
  }

  .mem-noteActions button.is-primary {
    background: #111827;
    color: #ffffff;
    padding-left: 11px;
    padding-right: 11px;
  }

  .mem-noteActions button.is-delete:hover {
    background: #fef2f2;
    color: #b91c1c;
  }

  .mem-empty {
    padding: 30px 20px;
    text-align: center;
    display: grid;
    justify-items: center;
    gap: 10px;
  }

  .mem-emptyIcon {
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e5e7eb;
    border-radius: 15px;
    background: #f8fafc;
    font-size: 22px;
  }

  .mem-error {
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #991b1b;
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 13px;
  }

  .mem-headerRight {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 0 0 auto;
  }

  .mem-count {
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

  .mem-learningHeading {
    margin-top: 18px;
    color: #374151;
    font-size: 13px;
    font-weight: 700;
  }

  .mem-revealActions {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding-top: 2px;
  }

  .mem-revealActions button {
    border: none;
    background: transparent;
    color: #475569;
    padding: 7px 9px;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
  }

  .mem-revealActions button:hover {
    color: #111827;
    text-decoration: underline;
  }

  @media (max-width: 900px) {
    .assistant-sectionDesktopSwitcher {
      display: none;
    }

    .db-pageStack.mem-page {
      padding: 0 12px 24px;
    }

    .mem-note {
      padding: 14px;
    }

    .mem-headerRight {
      align-items: flex-start;
    }

    .mem-count {
      margin-top: 1px;
    }
  }
`}</style>
    </div>
  );
}