'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';


const KEY_SELECTED = 'tz_db_conversations_selected';
const KEY_AI_DEFAULT = 'tz_ai_default_newchats'; // "1" or "0"


// ===== Naming =====
const STAFF_NAME = 'Kevin';
const STORE_ASSISTANT_NAME = 'Three Tree Assistant';
const DRAFT_PREFIX = 'Suggested reply (draft — not sent):';


type Preview = { role: string; content: string; createdAt: string };
type ListItem = {
  id: string;
  customerName: string;
  subject: string;
  status: 'open' | 'waiting' | 'closed';
  channel: 'web' | 'email' | 'shopify' | string;
  aiEnabled: boolean;
  tags: string[];
  lastMessageAt: string;
  preview: Preview | null;
};

type ThreadMessage = { id: string; role: string; content: string; createdAt: string };
type Thread = {
  id: string;
  customerName: string;
  subject: string;
  status: 'open' | 'waiting' | 'closed';
  channel: string;
  aiEnabled: boolean;
  tags: string[];
  lastMessageAt: string;
  messages: ThreadMessage[];
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function roleLabel(role: string) {
  if (role === 'customer') return 'Customer';
  if (role === 'assistant') return STORE_ASSISTANT_NAME;
  if (role === 'staff') return `Staff ${STAFF_NAME}`;
  if (role === 'note') return 'Internal note';
  return role;
}

function isDraftNote(text: string) {
  return text?.startsWith(DRAFT_PREFIX);
}

function extractDraftSuggestion(noteText: string) {
  if (!isDraftNote(noteText)) return '';
  const lines = noteText.split('\n');
  const startIdx = 1;
  if (lines.length <= startIdx) return '';
  const out: string[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (!line) break;
    if (line.startsWith('Context:')) break;
    out.push(line);
  }
  return out.join('\n').trim();
}

function assistantAutoReply(customerText: string) {
  const t = (customerText || '').toLowerCase();
  if (t.includes('return')) return 'Returns are accepted within 30 days if items are unworn with tags. Want me to outline the return steps?';
  if (t.includes('ship') || t.includes('delivery')) return 'Orders ship in 1–2 business days. Typical US delivery is 3–7 business days. What’s your ZIP code?';
  if (t.includes('order') || t.includes('tracking')) return 'I can help—please share your order number and the email used at checkout so I can check the status.';
  if (t.includes('xl') || t.includes('size')) return 'I can help with sizing. Which item are you looking at, and what size do you usually wear?';
  return 'Got it. Can you share a little more detail so I can help faster?';
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data?.ok) throw new Error(data?.error || `Request failed (${r.status})`);
  return data as T;
}

export default function ConversationsClient() {
  const [list, setList] = useState<ListItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [thread, setThread] = useState<Thread | null>(null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'open' | 'waiting' | 'closed'>('all');

  const [draft, setDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');

  const [aiDefault, setAiDefault] = useState(true);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);

  // mobile split view
  const [isMobile, setIsMobile] = useState(false);
  const [pane, setPane] = useState<'list' | 'thread'>('list');

  useEffect(() => {
    const saved = localStorage.getItem(KEY_AI_DEFAULT);
    if (saved === null) localStorage.setItem(KEY_AI_DEFAULT, '1');
    setAiDefault((saved ?? '1') === '1');
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1000px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    // @ts-expect-error older Safari
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    // @ts-expect-error older Safari
    else mq.addListener(onChange);
    return () => {
      // @ts-expect-error older Safari
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      // @ts-expect-error older Safari
      else mq.removeListener(onChange);
    };
  }, []);

  async function refreshList() {
    const data = await api<{ ok: true; conversations: ListItem[] }>('/api/conversations');
    setList(data.conversations);
    return data.conversations;
  }

  async function refreshThread(id: string) {
    const data = await api<{ ok: true; conversation: Thread }>(`/api/conversations/${id}`);
    setThread(data.conversation);
    return data.conversation;
  }

  useEffect(() => {
    (async () => {
      const conversations = await refreshList();

      const saved = localStorage.getItem(KEY_SELECTED) || '';
      const exists = !!saved && conversations.some((c) => c.id === saved);
      const initial = exists ? saved : (conversations[0]?.id || '');

      setSelectedId(initial);
      if (initial) {
        await refreshThread(initial);
      }
    })().catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedId) localStorage.setItem(KEY_SELECTED, selectedId);
  }, [selectedId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return list
      .filter((c) => (status === 'all' ? true : c.status === status))
      .filter((c) => {
        if (!query) return true;
        return (
          c.customerName.toLowerCase().includes(query) ||
          c.subject.toLowerCase().includes(query) ||
          c.tags.join(' ').toLowerCase().includes(query)
        );
      });
  }, [list, q, status]);

  const selectConversation = async (id: string) => {
    setSelectedId(id);
    await refreshThread(id);
    if (isMobile) setPane('thread');
  };

  const toggleAiDefault = () => {
    setAiDefault((prev) => {
      const next = !prev;
      localStorage.setItem(KEY_AI_DEFAULT, next ? '1' : '0');
      return next;
    });
  };

  const resetInbox = async () => {
    await api('/api/conversations/reset', { method: 'POST', body: JSON.stringify({ aiEnabled: aiDefault }) });
    const convos = await refreshList();
    const first = convos[0]?.id || '';
    setSelectedId(first);
    if (first) await refreshThread(first);
    if (isMobile) setPane('list');
  };

  const newTestChat = async () => {
    const res = await api<{ ok: true; id: string }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ aiEnabled: aiDefault }),
    });
    const convos = await refreshList();
    setSelectedId(res.id);
    await refreshThread(res.id);
    if (isMobile) setPane('thread');
  };

  const setConvStatus = async (s: 'open' | 'waiting' | 'closed') => {
    if (!thread) return;
    await api(`/api/conversations/${thread.id}/status`, { method: 'POST', body: JSON.stringify({ status: s }) });
    await refreshThread(thread.id);
    await refreshList();
  };

  const takeOverThisChat = async () => {
    if (!thread) return;
    await api(`/api/conversations/${thread.id}/ai`, { method: 'POST', body: JSON.stringify({ aiEnabled: false }) });
    if (thread.status !== 'closed') {
      await api(`/api/conversations/${thread.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'waiting' }) });
    }
    await refreshThread(thread.id);
    await refreshList();
  };

  const resumeAiThisChat = async () => {
    if (!thread) return;
    await api(`/api/conversations/${thread.id}/ai`, { method: 'POST', body: JSON.stringify({ aiEnabled: true }) });
    if (thread.status !== 'closed') {
      await api(`/api/conversations/${thread.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'open' }) });
    }
    await refreshThread(thread.id);
    await refreshList();
  };

  const addTag = async () => {
    if (!thread) return;
    const t = tagDraft.trim();
    if (!t) return;
    const nextTags = Array.from(new Set([...(thread.tags || []), t]));
    setTagDraft('');
    await api(`/api/conversations/${thread.id}/tags`, { method: 'POST', body: JSON.stringify({ tags: nextTags }) });
    await refreshThread(thread.id);
    await refreshList();
  };

  const removeTag = async (t: string) => {
    if (!thread) return;
    const nextTags = (thread.tags || []).filter((x) => x !== t);
    await api(`/api/conversations/${thread.id}/tags`, { method: 'POST', body: JSON.stringify({ tags: nextTags }) });
    await refreshThread(thread.id);
    await refreshList();
  };

  const sendStaffReply = async () => {
    if (!thread) return;
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    await api(`/api/conversations/${thread.id}/message`, {
      method: 'POST',
      body: JSON.stringify({ role: 'staff', content: text }),
    });
    await refreshThread(thread.id);
    await refreshList();
  };

  const addInternalNote = async () => {
    if (!thread) return;
    const note = window.prompt('Internal note (only visible to your team):');
    if (!note || !note.trim()) return;
    await api(`/api/conversations/${thread.id}/message`, {
      method: 'POST',
      body: JSON.stringify({ role: 'note', content: note.trim() }),
    });
    await refreshThread(thread.id);
    await refreshList();
  };

  const generateDraft = async () => {
    if (!thread) return;
    const lastCustomer = [...thread.messages].reverse().find((m) => m.role === 'customer');
    const customerText = lastCustomer?.content?.trim() || '';
    const suggestion = assistantAutoReply(customerText || 'Customer needs help.');

    const note =
      `${DRAFT_PREFIX}\n` +
      `${suggestion}\n\n` +
      `Context: last customer message → "${customerText || '(none)'}"`;

    await api(`/api/conversations/${thread.id}/message`, {
      method: 'POST',
      body: JSON.stringify({ role: 'note', content: note }),
    });
    await refreshThread(thread.id);
    await refreshList();
  };

  const insertDraftIntoReply = (noteText: string) => {
    const suggestion = extractDraftSuggestion(noteText);
    if (!suggestion) return;

    setDraft((prev) => {
      if (!prev.trim()) return suggestion;
      return `${prev.trim()}\n\n${suggestion}`;
    });

    setTimeout(() => replyRef.current?.focus(), 0);
  };

  const listHidden = isMobile && pane === 'thread';
  const threadHidden = isMobile && pane === 'list';

  return (
    <div>
      <div className="db-top">
        <div>
          <h1 className="db-title">Conversations</h1>
          <p className="db-sub">Now backed by SQLite (Prisma). Staff replies never trigger bot replies.</p>
        </div>

        <div className="db-actions">
          <button className="db-btn" onClick={resetInbox}>Reset inbox</button>
          <button className="db-btn primary" onClick={newTestChat}>New test chat</button>

          <button className={aiDefault ? 'db-btn primary' : 'db-btn'} onClick={toggleAiDefault} title="Default AI for new chats">
            New chats AI: {aiDefault ? 'ON' : 'OFF'}
          </button>

          <select className="db-btn" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="waiting">Waiting</option>
            <option value="closed">Closed</option>
          </select>

          <input
            className="db-btn"
            style={{ minWidth: 220 }}
            placeholder="Search (name, subject, tag)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="cx-grid">
        <div className={['db-card cx-list cx-pane', listHidden ? 'is-hidden' : ''].filter(Boolean).join(' ')}>
          {filtered.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={['cx-item', active ? 'active' : ''].filter(Boolean).join(' ')}
              >
                <div className="cx-row">
                  <div className="cx-customer">{c.customerName}</div>
                  <div className="cx-time">{fmtTime(c.lastMessageAt)}</div>
                </div>

                <div className="cx-subject">{c.subject}</div>

                <div className="cx-tags">
                  <span className="db-pill">{c.status}</span>
                  <span className="db-pill">{c.channel}</span>
                  <span className="db-pill">{c.aiEnabled ? 'AI' : 'Human'}</span>
                  {c.tags.slice(0, 2).map((t) => (
                    <span className="db-pill" key={t}>{t}</span>
                  ))}
                </div>

                <div className="cx-preview">
                  {c.preview ? `${roleLabel(c.preview.role)}: ${c.preview.content.slice(0, 70)}` : 'No messages yet'}
                </div>
              </button>
            );
          })}

          {!filtered.length && (
            <div style={{ padding: 12, fontSize: 13, opacity: 0.7 }}>No conversations yet. Click “Reset inbox”.</div>
          )}
        </div>

        <div className={['db-card cx-pane', threadHidden ? 'is-hidden' : ''].filter(Boolean).join(' ')} style={{ padding: 14 }}>
          {!thread ? (
            <div style={{ opacity: 0.7 }}>Select a conversation.</div>
          ) : (
            <>
              <div className="cx-topRow">
                <div>
                  <div className="cx-threadName">{thread.customerName}</div>
                  <div className="cx-threadSubject">{thread.subject}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="db-pill">{thread.status}</span>
                    <span className="db-pill">{thread.channel}</span>
                    <span className="db-pill">Staff: {STAFF_NAME}</span>
                    <span className="db-pill">Bot: {STORE_ASSISTANT_NAME}</span>
                    <span className="db-pill">{thread.aiEnabled ? 'AI enabled' : 'Human takeover'}</span>
                    <span className="db-pill">Updated {fmtTime(thread.lastMessageAt)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {isMobile && (
                    <button className="db-btn cx-backBtn" onClick={() => setPane('list')}>
                      ← Inbox
                    </button>
                  )}

                  {thread.aiEnabled ? (
                    <button className="db-btn" onClick={takeOverThisChat} title="Disable AI for this conversation only">
                      Take over (this chat)
                    </button>
                  ) : (
                    <button className="db-btn" onClick={resumeAiThisChat} title="Enable AI for this conversation only">
                      Resume AI (this chat)
                    </button>
                  )}

                  <button className="db-btn" onClick={generateDraft} title="Create a suggested reply as an internal note (not sent)">
                    Generate draft
                  </button>

                  <button className="db-btn" onClick={addInternalNote}>Add note</button>
                  {thread.status !== 'closed' ? (
                    <button className="db-btn" onClick={() => setConvStatus('closed')}>Close</button>
                  ) : (
                    <button className="db-btn" onClick={() => setConvStatus('open')}>Reopen</button>
                  )}
                  <button className="db-btn" onClick={() => setConvStatus('waiting')}>Mark waiting</button>
                </div>
              </div>

              <div className="cx-tagRow">
                {thread.tags.map((t) => (
                  <span className="cx-chip" key={t}>
                    {t}
                    <button onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>×</button>
                  </span>
                ))}

                <input
                  className="cx-tagInput"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  placeholder="Add tag…"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                />
                <button className="db-btn" onClick={addTag}>Add</button>
              </div>

              <div style={{ marginTop: 12, borderTop: '1px solid #eef2f7', paddingTop: 12 }}>
                <div className="cx-msgList">
                  {thread.messages.map((m) => {
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
                          ].filter(Boolean).join(' ')}
                        >
                          <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>

                          {showInsert && (
                            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                              <button className="db-btn" onClick={() => insertDraftIntoReply(m.content)}>
                                Insert draft
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="cx-replyBox">
                  <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                    Reply as Staff {STAFF_NAME}
                  </div>

                  <textarea
                    ref={replyRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    placeholder="Type your reply…"
                    className="cx-textarea"
                  />
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="db-btn primary" onClick={sendStaffReply}>Send</button>
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                  Drafts appear as <strong>Internal note</strong>. Use <strong>Insert draft</strong> to load it into the reply box.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
