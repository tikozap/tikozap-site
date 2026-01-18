'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ConversationsHeader from './ConversationsHeader';
import ConversationList from './ConversationList';
import ConversationThread from './ConversationThread';

const KEY_SELECTED = 'tz_db_conversations_selected';
const KEY_AI_DEFAULT = 'tz_ai_default_newchats'; // "1" or "0"

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
  archivedAt?: string | null;
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
  archivedAt?: string | null;
  messages: ThreadMessage[];
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  if (t.includes('return'))
    return 'Returns are accepted within 30 days if items are unworn with tags. Want me to outline the return steps?';
  if (t.includes('ship') || t.includes('delivery'))
    return 'Orders ship in 1–2 business days. Typical US delivery is 3–7 business days. What’s your ZIP code?';
  if (t.includes('order') || t.includes('tracking'))
    return 'I can help—please share your order number and the email used at checkout so I can check the status.';
  if (t.includes('xl') || t.includes('size'))
    return 'I can help with sizing. Which item are you looking at, and what size do you usually wear?';
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
  const searchParams = useSearchParams();

  const [list, setList] = useState<ListItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [thread, setThread] = useState<Thread | null>(null);

  const [showArchived, setShowArchived] = useState(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'open' | 'waiting' | 'closed'>('all');

  const [draft, setDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');

  const [aiDefault, setAiDefault] = useState(true);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [pane, setPane] = useState<'list' | 'thread'>('list');

  // AI default (new chats)
  useEffect(() => {
    const saved = localStorage.getItem(KEY_AI_DEFAULT);
    if (saved === null) localStorage.setItem(KEY_AI_DEFAULT, '1');
    setAiDefault((saved ?? '1') === '1');
  }, []);

  // Mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }

    const legacyMq = mq as unknown as {
      addListener?: (cb: () => void) => void;
      removeListener?: (cb: () => void) => void;
    };

    legacyMq.addListener?.(onChange);
    return () => legacyMq.removeListener?.(onChange);
  }, []);

  // When switching to desktop, keep pane reset
  useEffect(() => {
    if (!isMobile) setPane('list');
  }, [isMobile]);

  const refreshList = useCallback(async () => {
    const url = showArchived ? '/api/conversations?includeArchived=1' : '/api/conversations';
    const data = await api<{ ok: true; conversations: ListItem[] }>(url);
    setList(data.conversations);
    return data.conversations;
  }, [showArchived]);

  const refreshThread = useCallback(async (id: string) => {
    const data = await api<{ ok: true; conversation: Thread }>(`/api/conversations/${id}`);
    setThread(data.conversation);
    return data.conversation;
  }, []);

  // Initial load + when archive toggle changes
  useEffect(() => {
    (async () => {
      const conversations = await refreshList();

      const cid = searchParams?.get('cid') || '';
      const saved =
        cid ||
        localStorage.getItem(KEY_SELECTED) ||
        localStorage.getItem('tz_demo_conversations_selected') ||
        '';

      const exists = !!saved && conversations.some((c) => c.id === saved);
      const initial =
        cid && conversations.some((c) => c.id === cid)
          ? cid
          : exists
            ? saved
            : conversations[0]?.id || '';

      setSelectedId(initial);
      if (initial) await refreshThread(initial);
    })().catch(() => {});
  }, [refreshList, refreshThread, searchParams]);

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

  const selectConversation = useCallback(
    async (id: string) => {
      setSelectedId(id);
      await refreshThread(id);
      if (isMobile) setPane('thread');
    },
    [isMobile, refreshThread]
  );

  // Expose a single toggle function for DashboardShell’s top-right button
  useEffect(() => {
    (window as any).__tzToggleCxPane = () => {
      if (!isMobile) return;
      setPane((p) => (p === 'list' ? 'thread' : 'list'));
    };

    return () => {
      delete (window as any).__tzToggleCxPane;
    };
  }, [isMobile]);

  // Broadcast pane so DashboardShell can swap icon if you want
  useEffect(() => {
    if (!isMobile) return;
    window.dispatchEvent(new CustomEvent('tz:cx:pane', { detail: { pane } }));
  }, [isMobile, pane]);

  const toggleAiDefault = () => {
    setAiDefault((prev) => {
      const next = !prev;
      localStorage.setItem(KEY_AI_DEFAULT, next ? '1' : '0');
      return next;
    });
  };

  const resetInbox = async () => {
    await api('/api/conversations/reset', {
      method: 'POST',
      body: JSON.stringify({ aiEnabled: aiDefault }),
    });
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
    await refreshList();
    setSelectedId(res.id);
    await refreshThread(res.id);
    if (isMobile) setPane('thread');
  };

  const setConvStatus = async (s: 'open' | 'waiting' | 'closed') => {
    if (!thread) return;
    await api(`/api/conversations/${thread.id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: s }),
    });
    await refreshThread(thread.id);
    await refreshList();
  };

  const archiveThisChat = async () => {
    if (!thread) return;
    await api(`/api/conversations/${thread.id}/archive`, { method: 'POST' });
    await refreshThread(thread.id);
    await refreshList();
  };

  const restoreThisChat = async () => {
    if (!thread) return;
    await api(`/api/conversations/${thread.id}/restore`, { method: 'POST' });
    await refreshThread(thread.id);
    await refreshList();
  };

  const takeOverThisChat = async () => {
    if (!thread) return;
    await api(`/api/conversations/${thread.id}/ai`, {
      method: 'POST',
      body: JSON.stringify({ aiEnabled: false }),
    });
    if (thread.status !== 'closed') {
      await api(`/api/conversations/${thread.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: 'waiting' }),
      });
    }
    await refreshThread(thread.id);
    await refreshList();
  };

  const resumeAiThisChat = async () => {
    if (!thread) return;
    await api(`/api/conversations/${thread.id}/ai`, {
      method: 'POST',
      body: JSON.stringify({ aiEnabled: true }),
    });
    if (thread.status !== 'closed') {
      await api(`/api/conversations/${thread.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: 'open' }),
      });
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
    await api(`/api/conversations/${thread.id}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags: nextTags }),
    });
    await refreshThread(thread.id);
    await refreshList();
  };

  const removeTag = async (t: string) => {
    if (!thread) return;
    const nextTags = (thread.tags || []).filter((x) => x !== t);
    await api(`/api/conversations/${thread.id}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags: nextTags }),
    });
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
  const showHeader = !isMobile || pane === 'list';

  return (
    <div className="cx-workspace">
      {showHeader && (
        <ConversationsHeader
          aiDefault={aiDefault}
          showArchived={showArchived}
          status={status}
          q={q}
          onResetInbox={resetInbox}
          onNewTestChat={newTestChat}
          onToggleAiDefault={toggleAiDefault}
          onToggleArchived={() => setShowArchived((v) => !v)}
          onStatusChange={setStatus}
          onQueryChange={setQ}
        />
      )}

      <div className="cx-grid">
        <ConversationList
          items={filtered}
          selectedId={selectedId}
          onSelect={selectConversation}
          fmtTime={fmtTime}
          roleLabel={roleLabel}
          hidden={listHidden}
        />

        <ConversationThread
          thread={thread}
          hidden={threadHidden}
          isMobile={isMobile}
          onBackToList={() => setPane('list')}
          staffName={STAFF_NAME}
          assistantName={STORE_ASSISTANT_NAME}
          fmtTime={fmtTime}
          roleLabel={roleLabel}
          isDraftNote={isDraftNote}
          onTakeOver={takeOverThisChat}
          onResumeAi={resumeAiThisChat}
          onGenerateDraft={generateDraft}
          onAddNote={addInternalNote}
          onClose={() => setConvStatus('closed')}
          onReopen={() => setConvStatus('open')}
          onMarkWaiting={() => setConvStatus('waiting')}
          onArchive={archiveThisChat}
          onRestore={restoreThisChat}
          tagDraft={tagDraft}
          onTagDraftChange={setTagDraft}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onInsertDraft={insertDraftIntoReply}
          draft={draft}
          onDraftChange={setDraft}
          onSendReply={sendStaffReply}
          replyRef={replyRef}
        />
      </div>
    </div>
  );
}
