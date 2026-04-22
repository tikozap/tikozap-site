// src/app/dashboard/conversations/_components/ConversationsClient.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { buildSupportReply } from '@/lib/supportAssistant';


const KEY_SELECTED = 'tz_db_conversations_selected';
const KEY_AI_DEFAULT = 'tz_ai_default_newchats'; // "1" or "0"


// ===== Naming =====
const STAFF_NAME = 'Kevin';
const STORE_ASSISTANT_NAME = 'Demo Boutique Assistant';
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

  needsHuman: boolean;
  unread: boolean;
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

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data?.ok) throw new Error(data?.error || `Request failed (${r.status})`);
  return data as T;
}

function normalizeChannel(ch: string) {
  const s = (ch || '').toLowerCase();

  if (s.includes('phone') || s.includes('call')) return 'phone';
  if (s.includes('link')) return 'link';
  if (s.includes('email')) return 'email';
  if (s.includes('shopify')) return 'shopify';
  return 'web';
}

function channelLabel(key: string) {
  if (key === 'phone') return 'Caller';
  if (key === 'link') return 'Link';
  if (key === 'email') return 'Email';
  if (key === 'shopify') return 'Shopify';
  return 'Web';
}

function getInitials(name: string) {
  const s = (name || '').trim();
  if (!s) return '?';

  // Split on spaces, keep first 2 “words”
  const parts = s.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? (parts[0]?.[1] ?? ''); // fallback for single-word names

  return (first + second).toUpperCase();
}

export default function ConversationsClient() {

  const [list, setList] = useState<ListItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [thread, setThread] = useState<Thread | null>(null);
  const searchParams = useSearchParams();
  const [showArchived, setShowArchived] = useState(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'open' | 'waiting' | 'closed'>('all');

  const [draft, setDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');

const [aiDefault, setAiDefault] = useState(true);
const [previewProduct, setPreviewProduct] = useState<any | null>(null);
const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
const [productPickerOpen, setProductPickerOpen] = useState(false);
const replyRef = useRef<HTMLTextAreaElement | null>(null);
const messagesRef = useRef<HTMLDivElement | null>(null);

const lastSeenTopIdRef = useRef<string>('');
const pollingRef = useRef<number | null>(null);

const swipeRef = useRef<HTMLDivElement | null>(null);
const startXRef = useRef(0);
const startYRef = useRef(0);
const deltaXRef = useRef(0);
const deltaYRef = useRef(0);

const autoTakeoverTriggeredRef = useRef(false);
const [showMobileNeedsHumanDot, setShowMobileNeedsHumanDot] = useState(false);

// mobile split view
const [isMobile, setIsMobile] = useState(false);
const [pane, setPane] = useState<'list' | 'thread'>('list');
const [threadMenuOpen, setThreadMenuOpen] = useState(false);
const [dragX, setDragX] = useState(0);
const [isClosingThread, setIsClosingThread] = useState(false);
const revealPct = Math.max(0, Math.min(dragX / 320, 1));
const [isOpeningThread, setIsOpeningThread] = useState(false);

useEffect(() => {
  autoTakeoverTriggeredRef.current = false;
}, [thread?.id]);

useEffect(() => {
  if (!isMobile || pane !== "thread" || !thread) {
    setShowMobileNeedsHumanDot(false);
    return;
  }

  const needsHuman = !!thread.needsHuman || thread.status === "waiting";
  setShowMobileNeedsHumanDot(needsHuman);
}, [isMobile, pane, thread?.id, thread?.needsHuman, thread?.status]);

useEffect(() => {
    const saved = localStorage.getItem(KEY_AI_DEFAULT);
    if (saved === null) localStorage.setItem(KEY_AI_DEFAULT, '1');
    setAiDefault((saved ?? '1') === '1');
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

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
  
useEffect(() => {
  (async () => {
    const conversations = await refreshList();

    // Prefer cid from URL, then localStorage
    const cid = searchParams?.get("cid") || "";
    const saved =
      cid ||
      localStorage.getItem(KEY_SELECTED) ||
      localStorage.getItem("tz_demo_conversations_selected") ||
      "";

    const exists = !!saved && conversations.some((c) => c.id === saved);

    const initial =
      cid && conversations.some((c) => c.id === cid)
        ? cid
        : exists
          ? saved
          : conversations[0]?.id || "";

    setSelectedId(initial);

    if (initial) {
      // mark as seen so unread clears immediately
      api(`/api/conversations/${initial}/seen`, { method: "POST" }).catch(() => {});
      await refreshThread(initial);
    }
  })().catch(() => {});
}, [refreshList, refreshThread, searchParams]);

useEffect(() => {
  if (pollingRef.current) window.clearInterval(pollingRef.current);

  pollingRef.current = window.setInterval(async () => {
    try {
      if (document.visibilityState !== "visible") return;

      const convos = await refreshList();
      const topId = convos?.[0]?.id || "";

      // remember the last top id we saw (optional, for future indicators)
      if (topId) lastSeenTopIdRef.current = topId;

      // If user hasn't selected anything yet, select first.
      if (!selectedId && topId) {
        setSelectedId(topId);
        api(`/api/conversations/${topId}/seen`, { method: "POST" }).catch(() => {});
        await refreshThread(topId);
        return;
      }

      // Refresh the currently open thread so new widget messages appear
      if (selectedId) {
        await refreshThread(selectedId);
      }
    } catch {
      // ignore transient errors
    }
  }, 3000);

  return () => {
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = null;
  };
}, [refreshList, refreshThread, selectedId]);

  useEffect(() => {
    if (selectedId) localStorage.setItem(KEY_SELECTED, selectedId);
  }, [selectedId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return list
      .filter((c: any) => (status === 'all' ? true : c.status === status))
      .filter((c: any) => {
        if (!query) return true;
        return (
          c.customerName.toLowerCase().includes(query) ||
          c.subject.toLowerCase().includes(query) ||
          c.tags.join(' ').toLowerCase().includes(query)
        );
      });
  }, [list, q, status]);

useEffect(() => {
  if (!isMobile) return;
  if (pane !== 'thread') return;

  const t = window.setTimeout(() => {
    replyRef.current?.focus();
  }, 120);

  return () => window.clearTimeout(t);
}, [isMobile, pane, selectedId]);

useEffect(() => {
  autoResizeComposer();
}, [draft, isMobile, pane, selectedId]);

useEffect(() => {
  if (!thread) return;

  const el = messagesRef.current;
  if (!el) return;

  const scrollToBottom = (behavior: ScrollBehavior) => {
    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
  };

  // initial snap
  requestAnimationFrame(() => scrollToBottom('auto'));

  // smooth follow-up (after layout)
  const t = window.setTimeout(() => {
    scrollToBottom('smooth');
  }, 80);

  return () => window.clearTimeout(t);
}, [thread?.id, thread?.messages?.length, pane]);

  const summary = useMemo(() => {
  const active = list.filter((c) => !c.archivedAt);
  const handledToday = active.length;
  const needsAttention = active.filter((c) => c.needsHuman || c.status === 'waiting').length;
  const autoResolvedBase = Math.max(handledToday - needsAttention, 0);
  const autoResolvedPct =
    handledToday > 0 ? Math.round((autoResolvedBase / handledToday) * 100) : 0;

  return {
    handledToday,
    autoResolvedPct,
    needsAttention,
  };
}, [list]);

const selectConversation = async (id: string) => {
  setSelectedId(id);

  api(`/api/conversations/${id}/seen`, { method: "POST" }).catch(() => {});

  await refreshThread(id);

  if (isMobile) {
    setIsOpeningThread(true);
    setDragX(window.innerWidth);
    setPane("thread");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDragX(0);
      });
    });

    window.setTimeout(() => {
      setIsOpeningThread(false);
    }, 220);
  }
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
    await api(`/api/conversations/${thread.id}/ai`, { method: 'POST', body: JSON.stringify({ aiEnabled: false }) });
    if (thread.status !== 'closed') {
      await api(`/api/conversations/${thread.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'waiting' }) });
    }
    await refreshThread(thread.id);
    await refreshList();
  };

const ensureHumanTakeoverForDraft = async () => {
  if (!thread) return;
  if (!thread.aiEnabled) return;

  // optimistic UI update first
  setThread((prev: any) =>
    prev
      ? {
          ...prev,
          aiEnabled: false,
          needsHuman: false,
          status: prev.status === "closed" ? prev.status : "waiting",
        }
      : prev
  );

  await api(`/api/conversations/${thread.id}/ai`, {
    method: "POST",
    body: JSON.stringify({ aiEnabled: false }),
  });

  if (thread.status !== "closed") {
    await api(`/api/conversations/${thread.id}/status`, {
      method: "POST",
      body: JSON.stringify({ status: "waiting" }),
    });
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

  const hiddenSystemTags = new Set([
    "starter-link",
    "no-website",
    "widget-test",
    "order-status",
  ]);

  const systemTags = (thread.tags || []).filter(
    (x: any) => typeof x === "string" && hiddenSystemTags.has(x)
  );

  const visibleTags = (thread.tags || []).filter(
    (x: any) => !(typeof x === "string" && hiddenSystemTags.has(x))
  );

  const nextTags = [...systemTags, ...Array.from(new Set([...visibleTags, t]))];

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

  const hiddenSystemTags = new Set([
    "starter-link",
    "no-website",
    "widget-test",
    "order-status",
  ]);

  const systemTags = (thread.tags || []).filter(
    (x: any) => typeof x === "string" && hiddenSystemTags.has(x)
  );

  const visibleTags = (thread.tags || []).filter(
    (x: any) => !(typeof x === "string" && hiddenSystemTags.has(x))
  );

  const nextVisibleTags = visibleTags.filter((x: any) => x !== t);
  const nextTags = [...systemTags, ...nextVisibleTags];

  await api(`/api/conversations/${thread.id}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tags: nextTags }),
  });
  await refreshThread(thread.id);
  await refreshList();
};

const addProductToReply = async (product: any) => {
  if (
    thread?.aiEnabled &&
    !autoTakeoverTriggeredRef.current
  ) {
    autoTakeoverTriggeredRef.current = true;
    await ensureHumanTakeoverForDraft();
  }

  setSelectedProducts((prev) => {
    const exists = prev.some((p) => String(p.id) === String(product.id));
    if (exists) return prev;
    return [...prev, product];
  });

  setProductPickerOpen(false);
  setPreviewProduct(null);

  setDraft((prev) => {
    const title = product?.title || "Product";
    const line = `Check this out: ${title}`;
    return prev.trim() ? `${prev.trim()}\n\n${line}` : line;
  });

  setTimeout(() => replyRef.current?.focus(), 0);
};

const removeSelectedProduct = (id: string | number) => {
  setSelectedProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
};

const autoResizeComposer = () => {
  const el = replyRef.current;
  if (!el) return;

  el.style.height = '0px';
  const next = Math.min(el.scrollHeight, 160);
  el.style.height = `${next}px`;
};

const sendStaffReply = async () => {
  if (!thread) return;

  const text = draft.trim();
  const products = selectedProducts;

  if (!text && products.length === 0) return;

  setDraft('');
  setSelectedProducts([]);

  await api(`/api/conversations/${thread.id}/message`, {
    method: 'POST',
    body: JSON.stringify({
      role: 'staff',
      content: text,
      products,
    }),
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
    const lastCustomer = [...thread.messages].reverse().find((m: any) => m.role === 'customer');
    const customerText = lastCustomer?.content?.trim() || '';
    const suggestion = buildSupportReply(customerText || 'Customer needs help.').reply;

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
  const currentChannel = thread ? channelLabel(normalizeChannel(thread.channel)) : '';
  const currentModeLabel = thread ? (thread.aiEnabled ? 'AI active' : 'Staff replying') : '';

const onTouchStart = (e: React.TouchEvent) => {
  if (!isMobile) return;
  startXRef.current = e.touches[0].clientX;
  startYRef.current = e.touches[0].clientY;
  deltaXRef.current = 0;
  deltaYRef.current = 0;
  setIsClosingThread(false);
};

const onTouchMove = (e: React.TouchEvent) => {
  if (!isMobile) return;

  deltaXRef.current = e.touches[0].clientX - startXRef.current;
  deltaYRef.current = e.touches[0].clientY - startYRef.current;

  const dx = deltaXRef.current;
  const dy = deltaYRef.current;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  // only react when horizontal gesture clearly wins
  if (absX < 10 || absX <= absY * 1.2) return;

  // thread -> inbox drag preview
  if (pane === 'thread' && dx > 0) {
    setDragX(Math.min(dx, 320));
  }
};

const onTouchEnd = () => {
  if (!isMobile) return;

  const dx = deltaXRef.current;
  const dy = deltaYRef.current;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX < 60 || absX <= absY * 1.2) {
    setDragX(0);
    return;
  }

  if (pane === 'thread' && dx > 60) {
    setIsClosingThread(true);
    setDragX(window.innerWidth);

    window.setTimeout(() => {
      setPane('list');
      setDragX(0);
      setIsClosingThread(false);
    }, 180);

    return;
  }

  setDragX(0);
};

const renderProductPicker = () => {
  if (!productPickerOpen) return null;

  const demoProducts = [
    {
      id: 'p1',
      title: 'City Rain Jacket',
      price: 89,
      image: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=80',
      available: true,
      url: '#',
    },
    {
      id: 'p2',
      title: 'Insulated Winter Jacket',
      price: 129,
      image: 'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=900&q=80',
      available: true,
      url: '#',
    },
    {
      id: 'p3',
      title: 'Classic Midi Dress',
      price: 89,
      image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=900&q=80',
      available: true,
      url: '#',
    },
  ];

  return (
    <div className="cx-modalOverlay" onClick={() => setProductPickerOpen(false)}>
      <div className="cx-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="cx-modalClose"
          onClick={() => setProductPickerOpen(false)}
        >
          ×
        </button>

        <div className="cx-modalTitle">Insert product</div>

        <div className="cx-productList" style={{ marginTop: 12 }}>
          {demoProducts.map((p) => (
            <button
              key={p.id}
              type="button"
              className="cx-productRow cx-productRow--clickable"
              onClick={async () => {
                await addProductToReply(p);
                setProductPickerOpen(false);
              }}
            >
              <div className="cx-productLeft">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.title || 'Product'}
                    className="cx-productThumb"
                  />
                ) : (
                  <div className="cx-productThumb cx-productThumb--placeholder" />
                )}

                <div className="cx-productMeta">
                  <div className="cx-productTitle">{p.title || 'Product'}</div>
                  <div className="cx-productStock">
                    {p.available === false ? 'Unavailable' : 'In stock'}
                  </div>
                </div>
              </div>

              <div className="cx-productRight">
                <div className="cx-productPrice">
                  {typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : p.price}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const renderProductModal = () => {
  if (!previewProduct) return null;

  return (
    <div className="cx-modalOverlay" onClick={() => setPreviewProduct(null)}>
      <div
        className="cx-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="cx-modalClose"
          onClick={() => setPreviewProduct(null)}
        >
          ×
        </button>

        {previewProduct.image && (
          <img
            src={previewProduct.image}
            alt={previewProduct.title || 'Product'}
            className="cx-modalImage"
          />
        )}

        <div className="cx-modalTitle">
          {previewProduct.title || 'Product'}
        </div>

        <div className="cx-modalMeta">
          <span>
            {previewProduct.available === false ? 'Unavailable' : 'In stock'}
          </span>
          <span className="cx-modalPrice">
            {typeof previewProduct.price === 'number'
              ? `$${previewProduct.price.toFixed(2)}`
              : previewProduct.price || ''}
          </span>
        </div>

{previewProduct.url && previewProduct.url !== '#' && (
  <a
    href={previewProduct.url}
    target="_blank"
    rel="noreferrer"
    className="cx-modalBtn"
  >
    View product
  </a>
)}
      </div>
    </div>
  );
};

const renderThreadMenuSheet = () => {
  if (!thread || !threadMenuOpen) return null;

  return (
    <div className="cx-sheetOverlay" onClick={() => setThreadMenuOpen(false)}>
      <div className="cx-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cx-sheetTop">
          <div>
            <div className="cx-sheetTitle">{thread.customerName}</div>
            <div className="cx-sheetSub">
              {currentChannel} • {thread.aiEnabled ? 'AI active' : 'Staff replying'}
            </div>
          </div>
          <button className="cx-sheetClose" onClick={() => setThreadMenuOpen(false)}>
            ×
          </button>
        </div>

        <div className="cx-sheetActions">
          {thread.aiEnabled ? (
            <button className="db-btn" onClick={async () => { setThreadMenuOpen(false); await takeOverThisChat(); }}>
              Take over
            </button>
          ) : (
            <button className="db-btn" onClick={async () => { setThreadMenuOpen(false); await resumeAiThisChat(); }}>
              Resume AI
            </button>
          )}

          <button className="db-btn" onClick={async () => { setThreadMenuOpen(false); await generateDraft(); }}>
            Generate draft
          </button>

          <button className="db-btn" onClick={async () => { setThreadMenuOpen(false); await addInternalNote(); }}>
            Add note
          </button>

          {thread.status !== 'closed' ? (
            <button className="db-btn" onClick={async () => { setThreadMenuOpen(false); await setConvStatus('closed'); }}>
              Close
            </button>
          ) : (
            <button className="db-btn" onClick={async () => { setThreadMenuOpen(false); await setConvStatus('open'); }}>
              Reopen
            </button>
          )}

          <button className="db-btn" onClick={async () => { setThreadMenuOpen(false); await setConvStatus('waiting'); }}>
            Mark waiting
          </button>

          {thread.archivedAt ? (
            <button className="db-btn" onClick={async () => { setThreadMenuOpen(false); await restoreThisChat(); }}>
              Restore
            </button>
          ) : (
            <button className="db-btn" onClick={async () => { setThreadMenuOpen(false); await archiveThisChat(); }}>
              Archive
            </button>
          )}
        </div>

        <div className="cx-sheetTags">
          <div className="cx-sheetSectionLabel">Tags</div>

          <div className="cx-tagRow">
            {thread.tags
  .filter((t: any) => !(
    typeof t === "string" &&
    ["starter-link", "no-website", "widget-test", "order-status"].includes(t)
  ))
  .map((t: any) => (
              <span className="cx-chip" key={t}>
                {t}
                <button onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>×</button>
              </span>
            ))}
          </div>

          <div className="cx-sheetTagAdd">
            <input
              className="cx-tagInput"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              placeholder="Add tag…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <button className="db-btn" onClick={addTag}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderConversationList = () => (
  <>
    {filtered.map((c: any) => {
      const active = c.id === selectedId;
      const archived = !!c.archivedAt;
      const chKey = normalizeChannel(c.channel);

      return (
        <button
          key={c.id}
          onClick={() => selectConversation(c.id)}
          className={[
            'cx-item',
            active ? 'active' : '',
            archived ? 'archived' : '',
          ].filter(Boolean).join(' ')}
        >
 <div className="cx-row">
  <div className="cx-avatar">{getInitials(c.customerName)}</div>

  <div className="cx-main">
    <div className="cx-top">
      <div className="cx-customer">{c.customerName || 'Unknown'}</div>
      <div className="cx-time">{fmtTime(c.lastMessageAt)}</div>
    </div>

    <div className="cx-meta">
      <div className="cx-subjectLine">
        {archived && <span className="cx-inlineLabel">Archived</span>}
        <span className="cx-inlineLabel">{channelLabel(chKey)}</span>
        <span className="cx-subjectText">{c.subject || '(no subject)'}</span>
      </div>

      <div className="cx-indicators">
        {c.needsHuman && <span className="cx-dot alert" title="Needs human" />}
        {c.unread && <span className="cx-dot unread" title="Unread" />}
      </div>
    </div>

    <div className="cx-preview">
      {c.preview ? c.preview.content.slice(0, 90) : 'No messages yet'}
    </div>
  </div>
</div>
        </button>
      );
    })}

    {!filtered.length && (
      <div style={{ padding: 12, fontSize: 13, opacity: 0.7 }}>
        No conversations yet. Click &ldquo;Reset inbox&rdquo; to load the Demo Boutique test set.
      </div>
    )}
  </>
);

const renderThreadBody = () => {
  if (!thread) {
    return <div style={{ opacity: 0.7 }}>Select a conversation.</div>;
  }

  const primaryAiAction = thread.aiEnabled ? (
    <button className="db-btn" onClick={takeOverThisChat}>
      Take over this call
    </button>
  ) : (
    <button className="db-btn" onClick={resumeAiThisChat}>
      Resume AI
    </button>
  );

  const hiddenSystemTags = new Set([
  "starter-link",
  "no-website",
  "widget-test",
  "order-status",
]);

const visibleTags = (thread.tags || []).filter(
  (t: any) => !(typeof t === "string" && hiddenSystemTags.has(t))
);

  return (
    <div className="cx-threadFrame">
      <div className="cx-threadHead">
        {isMobile ? (
<div className="cx-mobileThreadTop">
<div className="cx-mobileThreadLeft">
  <button
    type="button"
    className="db-btn cx-mobileTopBtn cx-backBtn"
    aria-label="Open menu"
    onClick={openDashboardNav}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="9" y1="5" x2="9" y2="19" stroke="currentColor" strokeWidth="2" />
    </svg>
  </button>

  <div className="cx-mobileBackWrap">
    <button
      type="button"
      className="db-btn cx-mobileTopBtn cx-backBtn"
      onClick={() => setPane('list')}
      aria-label="Back"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="cx-backChevron"
      >
        <path
          d="M14.5 5.5L8 12l6.5 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>

    {showMobileNeedsHumanDot && (
      <span
        className="cx-mobileNeedsHumanDot"
        aria-label="Needs human attention"
        title="Needs human attention"
      />
    )}
  </div>
</div>

<div className="cx-mobileThreadIdentity">
  <div className="cx-mobileThreadName">{thread.customerName}</div>
  <div className="cx-mobileThreadMeta">
    {currentChannel} • {currentModeLabel}
  </div>
</div>

<button
  type="button"
  className="db-btn cx-mobileTopBtn"
  onClick={() => setThreadMenuOpen(true)}
  aria-label="More"
>
  ⋯
</button>
</div>

        ) : (
          <>
            <div className="cx-threadHeadTop">
              <div className="cx-threadHeadMain">
                <div className="cx-threadNameRow">
                  <div className="cx-threadName">{thread.customerName}</div>
                  <span className="cx-inlineLabel">{currentChannel}</span>
                </div>

                <div className="cx-threadSubject">{thread.subject}</div>

                <div className="cx-tagRow">
                  {visibleTags.map((t: any) => (
                    <span className="cx-chip" key={t}>
                      {typeof t === 'string' ? t.charAt(0).toUpperCase() + t.slice(1) : t}
                      <button
                        onClick={() => removeTag(t)}
                        aria-label={`Remove tag ${t}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="cx-threadActionsGrid">
                <button className="db-btn" onClick={addInternalNote}>
                  Add note
                </button>

                {thread.status !== 'closed' ? (
                  <button className="db-btn" onClick={() => setConvStatus('closed')}>
                    Close
                  </button>
                ) : (
                  <button className="db-btn" onClick={() => setConvStatus('open')}>
                    Open
                  </button>
                )}

                <button className="db-btn" onClick={() => setConvStatus('waiting')}>
                  Mark waiting
                </button>

                <input
                  className="cx-tagInput"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  placeholder="Add tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />

                <button className="db-btn" onClick={addTag}>
                  Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div ref={messagesRef} className="cx-threadMessages">
        <div className="cx-msgList">
          {thread.messages.map((m: any) => {
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

                  {Array.isArray((m as any).products) && (m as any).products.length > 0 ? (
                    <div className="cx-productList">
                      {(m as any).products.map((p: any, idx: number) => {
                        const priceText =
                          typeof p.price === 'number'
                            ? `$${p.price.toFixed(2)}`
                            : p.price
                              ? String(p.price)
                              : '';

                        const stockText =
                          p.available === false ? 'Unavailable' : 'In stock';

                        const href =
                          typeof p.url === 'string' && p.url.trim() && p.url !== '#'
                            ? p.url
                            : '';

                        return (
                          <button
                            key={p.id ?? idx}
                            type="button"
                            className="cx-productRow cx-productRow--clickable"
                            onClick={() => {
                              setPreviewProduct(p);
                            }}
                            title="Product preview"
                          >
                            <div className="cx-productLeft">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.title || 'Product'}
                                  className="cx-productThumb"
                                />
                              ) : (
                                <div className="cx-productThumb cx-productThumb--placeholder" />
                              )}

                              <div className="cx-productMeta">
                                <div className="cx-productTitle">{p.title || 'Product'}</div>
                                <div className="cx-productStock">{stockText}</div>
                              </div>
                            </div>

                            <div className="cx-productRight">
                              <div className="cx-productPrice">{priceText}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

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
      </div>

<div className="cx-replyDock">
  <div className="cx-replyModeBar">
    <div>
  {!thread.aiEnabled && <span className="cx-replyModeHint">AI paused</span>}
  {!isMobile && <span> · Replying as {STAFF_NAME}</span>}
</div>

    <div className="cx-replyQuickActions">
  {primaryAiAction}

  <button
    className="db-btn"
    type="button"
    onClick={() => setProductPickerOpen(true)}
  >
    Insert product
  </button>

  <button className="db-btn" onClick={generateDraft}>
    Generate draft
  </button>
</div>
  </div>

  <div className="cx-composerWrap">
    {selectedProducts.length > 0 && (
  <div className="cx-selectedProducts">
    {selectedProducts.map((p: any) => (
      <div key={p.id} className="cx-selectedProductChip">
        <span>{p.title || 'Product'}</span>
        <button
          type="button"
          onClick={() => removeSelectedProduct(p.id)}
          aria-label={`Remove ${p.title || 'product'}`}
        >
          ×
        </button>
      </div>
    ))}
  </div>
)}
<textarea
  ref={replyRef}
  value={draft}
  onChange={async (e) => {
    const next = e.target.value;

    if (
      next.trim() &&
      thread?.aiEnabled &&
      !autoTakeoverTriggeredRef.current
    ) {
      autoTakeoverTriggeredRef.current = true;
      await ensureHumanTakeoverForDraft();
    }

    setDraft(next);
  }}
  onInput={autoResizeComposer}
  onKeyDown={async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      const text = draft.trim();
      if (!text) return;

      await sendStaffReply();
    }
  }}
  rows={1}
  placeholder="Type your reply..."
  className="cx-textarea cx-textarea--composer"
/>

    <button
      className="cx-sendFab"
      onClick={sendStaffReply}
      aria-label="Send"
      type="button"
    >
      ↑
    </button>
  </div>
</div>
    </div>
  );
};

const openDashboardNav = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tz-dashboard-toggle-nav'));
  }
};

const renderMobileInboxScreen = () => (
  <div className="cx-mobileScreen">
    <div className="cx-mobileInboxTop">
      <button
  type="button"
  className="cx-mobileTopBtn cx-backBtn"
  aria-label="Open menu"
  onClick={openDashboardNav}
  style={{
    WebkitAppearance: 'none',
    appearance: 'none',
    background: 'transparent',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    outline: 'none',
    color: '#111827',
  }}
>
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <line x1="9" y1="5" x2="9" y2="19" stroke="currentColor" strokeWidth="2" />
  </svg>
</button>

      <div className="cx-mobileInboxTitle">Inbox</div>

     <button
  type="button"
  className="cx-mobileTopBtn"
  aria-label="More"
  style={{
    WebkitAppearance: 'none',
    appearance: 'none',
    background: 'transparent',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    outline: 'none',
    color: '#111827',
  }}
>
  ⋯
</button>
    </div>

    <div className="cx-mobileSearchWrap">
      <input
        className="db-btn cx-mobileSearch"
        placeholder="Search (name, subject, tag)…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
    </div>

    <div className="cx-mobileList">
      {renderConversationList()}
    </div>
  </div>
);

const renderDesktopLayout = () => (
  <>
    <div className="db-top">
      <div>
        <h1 className="db-title">Conversations</h1>
        <div className="cx-quickLinks">
          <Link className="cx-quickLink db-pill" href="/dashboard/widget/test">
            Chat test bubble
          </Link>
          <Link className="cx-quickLink db-pill" href="/dashboard/widget">
            Website bubble
          </Link>
          <Link className="cx-quickLink db-pill" href="/dashboard/tikozap-link">
            Starter Link bubble
          </Link>
          <Link className="cx-quickLink db-pill" href="/dashboard/phone-agent?surface=caller">
            Caller link
          </Link>
          <Link className="cx-quickLink db-pill" href="/dashboard/phone-agent?surface=answer-machine">
            AnswerMachine link
          </Link>
        </div>
      </div>

      <div className="db-actions">
        <button className="db-btn" onClick={resetInbox}>Reset inbox</button>
        <button className="db-btn primary" onClick={newTestChat}>New test chat</button>
        <button className={aiDefault ? 'db-btn primary' : 'db-btn'} onClick={toggleAiDefault}>
          New chats AI: {aiDefault ? 'ON' : 'OFF'}
        </button>
        <button className={showArchived ? 'db-btn primary' : 'db-btn'} onClick={() => setShowArchived((v) => !v)}>
          Showing: {showArchived ? 'All' : 'Active'}
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

    <div className="cx-split">
  <div className="cx-listPane">
    {renderConversationList()}
  </div>

  <div className="cx-threadCol">
    <div className="cx-threadPane">
      {renderThreadBody()}
    </div>
  </div>
</div>
  </>
);

const renderMobileThreadScreen = () => (
  <div
    ref={swipeRef}
    className={[
      'cx-mobileThreadScreen',
      isClosingThread ? 'is-closing' : '',
      isOpeningThread ? 'is-opening' : '',
    ].filter(Boolean).join(' ')}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
    style={{
      transform: `translateX(${dragX}px)`,
      opacity: 1,
    }}
  >
    <div className="db-card cx-mobileThreadCard" style={{ padding: 14 }}>
      {renderThreadBody()}
    </div>
  </div>
);
  
const renderMobileLayout = () => {
  if (pane === 'list') {
    return (
      <div className="cx-mobileStage">
        <div className="cx-mobileInboxLayer is-active">
          {renderMobileInboxScreen()}
        </div>
      </div>
    );
  }

  return (
    <div className="cx-mobileStage">
      <div
  className="cx-mobileInboxLayer is-under-thread"
  style={{
    opacity: 1,
  }}
>
  {renderMobileInboxScreen()}
</div>

      <div className="cx-mobileThreadLayer is-active">
        {renderMobileThreadScreen()}
      </div>
    </div>
  );
};

  return (
  <div className="cx-mobileRoot">
    {isMobile ? renderMobileLayout() : renderDesktopLayout()}

    {renderProductModal()}
{renderProductPicker()}
{renderThreadMenuSheet()}
  </div>
);
}