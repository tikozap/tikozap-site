// src/app/dashboard/conversations/_components/ConversationsClient.tsx

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAssistantIdentity } from '../../assistant/_components/useAssistantIdentity';

const KEY_SELECTED = 'tz_db_conversations_selected';
const KEY_AI_DEFAULT = 'tz_ai_default_newchats'; // "1" or "0"
const KEY_ACTIVE_CUSTOMER_DOT = "tz_setting_active_customer_dot";
const KEY_BLINK_RED_DOT = "tz_setting_blink_red_dot";
const KEY_ESCALATION_SOUND = "tz_setting_escalation_sound";
const KEY_ESCALATION_VIBRATE = "tz_setting_escalation_vibrate";
const KEY_BROWSER_NOTIFICATIONS = "tz_browser_notifications";
const KEY_QUIET_HOURS = "tz_setting_quiet_hours";
const KEY_SOUND_LEVEL = "tz_setting_sound_level";

// ===== Naming =====
const STORE_ASSISTANT_NAME = 'Store Assistant';
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


type ThreadMessage = {
  id: string;
  role: string;
  content: string;
  source?: string | null;
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
  needsHuman: boolean;
  messages: ThreadMessage[];
};

function orderedThreadMessages(messages: ThreadMessage[], channel?: string) {
  const sorted = [...messages].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });

  if (!String(channel || "").includes("voice")) return sorted;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];

    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();

    if (
      a.role === "assistant" &&
      b.role === "customer" &&
      Math.abs(bTime - aTime) < 15000
    ) {
      sorted[i] = b;
      sorted[i + 1] = a;
      i++;
    }
  }

  return sorted;
}

function isCustomerActive(c: ListItem) {
  if (!c.lastMessageAt) return false;

  const last = new Date(c.lastMessageAt).getTime();
  if (!Number.isFinite(last)) return false;

  const ACTIVE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  return Date.now() - last < ACTIVE_WINDOW_MS;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getAvatarStyle(name: string) {
  const palettes = [
    { bg: "#E0F2FE", text: "#0369A1" }, // blue
    { bg: "#FCE7F3", text: "#BE185D" }, // pink
    { bg: "#FEF3C7", text: "#92400E" }, // yellow
    { bg: "#DCFCE7", text: "#166534" }, // green
    { bg: "#EDE9FE", text: "#5B21B6" }, // purple
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const idx = Math.abs(hash) % palettes.length;
  return {
    background: palettes[idx].bg,
    color: palettes[idx].text,
    border: "none",
  };
}

function roleLabel(
  role: string,
  assistantName: string,
  staffName: string
) {
  if (role === 'customer') return 'Customer';
  if (role === 'assistant') return assistantName;
  if (role === 'staff') return `Staff ${staffName}`;
  if (role === 'note') {
    return 'Internal note · only visible to your team';
  }

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

async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(path, {
      ...init,
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
    }

    return data as T;
  } catch (err: any) {
    console.error("[conversations api] failed:", path, err);
    throw new Error(err?.message || "Failed to fetch");
  }
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

export default function ConversationsClient({
  staffName,
}: {
  staffName: string;
}) {
  const { assistantName } = useAssistantIdentity();

  const fullAssistantName = assistantName?.trim() || 'Emma';

  const coachButtonName =
  fullAssistantName.length > 14
    ? `${fullAssistantName.slice(0, 14)}…`
    : fullAssistantName;

  const [list, setList] = useState<ListItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [thread, setThread] = useState<Thread | null>(null);

  const [showActiveCustomerDot, setShowActiveCustomerDot] = useState(true);
  const [blinkRedDot, setBlinkRedDot] = useState(true);
  const [vibrateOnEscalation, setVibrateOnEscalation] = useState(true);

  const [playEscalationSound, setPlayEscalationSound] = useState(true);
  const alertedNeedsHumanIdsRef = useRef<Set<string>>(new Set());
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] =
  useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [soundLevel, setSoundLevel] = useState("Soft");

  const searchParams = useSearchParams();
  const [showArchived, setShowArchived] = useState(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'open' | 'waiting' | 'closed'>('all');

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteToast, setNoteToast] = useState('');

  const [draft, setDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [suggestedDraft, setSuggestedDraft] = useState('');

const [aiDefault, setAiDefault] = useState(true);
const [previewProduct, setPreviewProduct] = useState<any | null>(null);
const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
const [selectedImages, setSelectedImages] = useState<any[]>([]);
const [productPickerOpen, setProductPickerOpen] = useState(false);

const replyRef = useRef<HTMLTextAreaElement | null>(null);
const messagesRef = useRef<HTMLDivElement | null>(null);

const lastSeenTopIdRef = useRef<string>('');
const pollingRef = useRef<number | null>(null);
const desktopListRef = useRef<HTMLDivElement | null>(null);
const mobileListRef = useRef<HTMLDivElement | null>(null);
const lastTopTimestampRef = useRef<number>(0);

const swipeRef = useRef<HTMLDivElement | null>(null);
const startXRef = useRef(0);
const startYRef = useRef(0);
const deltaXRef = useRef(0);
const deltaYRef = useRef(0);

const takeoverKey = (id: string) => `tz_takeover_started_${id}`;

const autoTakeoverTriggeredRef = useRef(false);
const [showMobileNeedsHumanDot, setShowMobileNeedsHumanDot] = useState(false);
const [welcomeTestOpen, setWelcomeTestOpen] = useState(false);
const [welcomeTestText, setWelcomeTestText] = useState('');
const [welcomeTestBusy, setWelcomeTestBusy] = useState(false);
const [welcomeTestMsg, setWelcomeTestMsg] = useState('');
const [welcomeTestMinimized, setWelcomeTestMinimized] = useState(false);
const [welcomePanelPos, setWelcomePanelPos] = useState({ x: 28, y: 96 });
const [welcomeTestConversationId, setWelcomeTestConversationId] = useState('');

const welcomeDragRef = useRef({
  dragging: false,
  startX: 0,
  startY: 0,
  startPanelX: 28,
  startPanelY: 96,
});

// mobile split view
const [isMobile, setIsMobile] = useState(false);
const [pane, setPane] = useState<'list' | 'thread'>('list');
const [threadMenuOpen, setThreadMenuOpen] = useState(false);
const [desktopThreadMenuOpen, setDesktopThreadMenuOpen] = useState(false);
const [dragX, setDragX] = useState(0);
const [isClosingThread, setIsClosingThread] = useState(false);
const revealPct = Math.max(0, Math.min(dragX / 320, 1));
const [isOpeningThread, setIsOpeningThread] = useState(false);
const [mobileInboxMenuOpen, setMobileInboxMenuOpen] = useState(false);

useEffect(() => {
  autoTakeoverTriggeredRef.current = false;
}, [thread?.id]);

useEffect(() => {
  if (!isMobile || pane !== "thread" || !thread) {
    setShowMobileNeedsHumanDot(false);
    return;
  }

  const needsHuman = !!thread.needsHuman;
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

  const autoResumeIdleAi = async (convos: ListItem[]) => {
  const AUTO_RESUME_MS = 15 * 60 * 1000;

  const now = Date.now();

  for (const c of convos) {
    if (c.aiEnabled) continue;
    if (c.status === "closed") continue;
    if (!c.lastMessageAt) continue;

    const takeoverStarted = Number(localStorage.getItem(takeoverKey(c.id)) || 0);
if (!Number.isFinite(takeoverStarted) || takeoverStarted <= 0) continue;

if (now - takeoverStarted >= AUTO_RESUME_MS) {
      await api(`/api/conversations/${c.id}/ai`, {
        method: "POST",
        body: JSON.stringify({ aiEnabled: true }),
      });

      localStorage.removeItem(takeoverKey(c.id));

      if (selectedId === c.id) {
        await refreshThread(c.id);
      }

      await refreshList();
      break;
    }
  }
};

useEffect(() => {
  const loadSettings = () => {
    setShowActiveCustomerDot(
      (localStorage.getItem(KEY_ACTIVE_CUSTOMER_DOT) ?? "1") === "1"
    );

    setBlinkRedDot(
      (localStorage.getItem(KEY_BLINK_RED_DOT) ?? "1") === "1"
    );

    setPlayEscalationSound(
      (localStorage.getItem(KEY_ESCALATION_SOUND) ?? "1") === "1"
    );

    setVibrateOnEscalation(
      (localStorage.getItem(KEY_ESCALATION_VIBRATE) ?? "1") === "1"
    );

    setQuietHoursEnabled(
      (localStorage.getItem(KEY_QUIET_HOURS) ?? "0") === "1"
    );

    setSoundLevel(localStorage.getItem(KEY_SOUND_LEVEL) || "Soft");
  };

  loadSettings();

  window.addEventListener("tz-settings-change", loadSettings);
  window.addEventListener("storage", loadSettings);

  return () => {
    window.removeEventListener("tz-settings-change", loadSettings);
    window.removeEventListener("storage", loadSettings);
  };
}, []);

const playSoftPing = () => {
  const soundEnabled =
    (localStorage.getItem(KEY_ESCALATION_SOUND) ?? "1") === "1";

  if (!soundEnabled) return;

  const beep = (delayMs: number) => {
    window.setTimeout(() => {
      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;

        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 720;

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);

        const currentLevel =
          localStorage.getItem(KEY_SOUND_LEVEL) || soundLevel || "Soft";

        const peak =
          currentLevel === "Loud" ? 0.32 :
          currentLevel === "Standard" ? 0.18 :
          0.08;

        gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.2);
      } catch {
        // ignore audio restrictions
      }
    }, delayMs);
  };

  beep(0);
  beep(220);
};

const vibrateOnce = () => {
  const vibrationEnabled =
    (localStorage.getItem(KEY_ESCALATION_VIBRATE) ?? "1") === "1";

  if (!vibrationEnabled) return;
  if (typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;

  try {
    navigator.vibrate(180);
  } catch {
    // ignore unsupported devices
  }
};

const requestBrowserNotificationPermission = async () => {
  if (typeof window === "undefined") return false;

  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  return false;
};

const showEscalationNotification = async (
  customerName: string,
  preview?: string
) => {
  if (!browserNotificationsEnabled) return;

  const allowed = await requestBrowserNotificationPermission();

  if (!allowed) return;

  try {
    const notification = new Notification("TikoZap • Human help requested", {
      body:
        preview ||
        `${customerName} is waiting for a human response.`,
      icon: "/icon-192.png",
      tag: "tikozap-escalation",
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // ignore notification failures
  }
};

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
  if (
    searchParams?.get('welcome') === '1' ||
    searchParams?.get('testAssistant') === '1' ||
    searchParams?.get('widgetTest') === '1'
  ) {
    setWelcomeTestOpen(true);
    setWelcomeTestMinimized(false);
  }
}, [searchParams]);

const returnToInboxList = () => {
  setPane('list');
  setDragX(0);
  setIsClosingThread(false);
  setIsOpeningThread(false);
};

useEffect(() => {
  if (!isMobile || pane !== 'list') return;

  let frame1 = 0;
  let frame2 = 0;
  let timer = 0;

  const resetMobileInboxViewport = () => {
    const mobileScreen =
      document.querySelector('.cx-mobileScreen');

    const mobileStage =
      document.querySelector('.cx-mobileStage');

    const mobileList =
      document.querySelector('.cx-mobileList');

    if (mobileScreen instanceof HTMLElement) {
      mobileScreen.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    }

    if (mobileStage instanceof HTMLElement) {
      mobileStage.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    }

    if (mobileList instanceof HTMLElement) {
      mobileList.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  };

  // First wait until React has rendered the list layer.
  frame1 = window.requestAnimationFrame(() => {
    // Then wait one more frame for Safari to settle
    // fixed -> relative viewport positioning.
    frame2 = window.requestAnimationFrame(() => {
      resetMobileInboxViewport();

      // Safari occasionally settles its visual viewport
      // slightly after paint, so repeat once.
      timer = window.setTimeout(() => {
        resetMobileInboxViewport();
      }, 80);
    });
  });

  return () => {
    window.cancelAnimationFrame(frame1);
    window.cancelAnimationFrame(frame2);
    window.clearTimeout(timer);
  };
}, [isMobile, pane]);

const scrollInboxToTop = () => {
  requestAnimationFrame(() => {
    desktopListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    mobileListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    const mobileScreen = document.querySelector('.cx-mobileScreen');
    if (mobileScreen instanceof HTMLElement) {
      mobileScreen.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const mobileStage = document.querySelector('.cx-mobileStage');
    if (mobileStage instanceof HTMLElement) {
      mobileStage.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

useEffect(() => {
  if (pollingRef.current) window.clearInterval(pollingRef.current);

  pollingRef.current = window.setInterval(async () => {
    try {
      if (document.visibilityState !== "visible") return;

      const convos = await refreshList();
      await autoResumeIdleAi(convos);
      const top = convos?.[0];
const topTs = top?.lastMessageAt
  ? new Date(top.lastMessageAt).getTime()
  : 0;

if (topTs > lastTopTimestampRef.current) {
      scrollInboxToTop();
}

if (topTs) {
  lastTopTimestampRef.current = topTs;
}
      setList(convos);
      const topId = convos?.[0]?.id || "";
      if (topId && topId !== lastSeenTopIdRef.current) {
       scrollInboxToTop();
}

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
const newestId = convos?.[0]?.id || "";

// Keep the currently open thread stable.
// Only auto-select if nothing is selected yet.
if (!selectedId && newestId) {
  setSelectedId(newestId);
  api(`/api/conversations/${newestId}/seen`, { method: "POST" }).catch(() => {});
  await refreshThread(newestId);
  return;
}

// Otherwise, just refresh the currently selected thread.
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

        const isQuietHoursNow = () => {
  if (!quietHoursEnabled) return false;

  const hour = new Date().getHours();
  return hour >= 22 || hour < 8;
};

useEffect(() => {
  for (const c of list) {
    if (!c.needsHuman) continue;

    if (!alertedNeedsHumanIdsRef.current.has(c.id)) {
      alertedNeedsHumanIdsRef.current.add(c.id);

if (!isQuietHoursNow()) {
  playSoftPing();

  vibrateOnce();

  showEscalationNotification(
    c.customerName || "Customer",
    c.preview?.content || "Customer needs human help."
  );
}

      break;
    }
  }

  const activeNeedsHumanIds = new Set(
    list.filter((c) => c.needsHuman).map((c) => c.id)
  );

  alertedNeedsHumanIdsRef.current.forEach((id) => {
    if (!activeNeedsHumanIds.has(id)) {
      alertedNeedsHumanIdsRef.current.delete(id);
    }
  });
}, [list, playEscalationSound, vibrateOnEscalation, quietHoursEnabled]);

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
  console.clear();

  api(`/api/conversations/${id}/seen`, { method: "POST" }).catch(() => {});

  try {
    await refreshThread(id);
  } catch (err: any) {
    console.error("[selectConversation] failed:", err);
   alert(err?.message || "Failed to load conversation.");
    return;
  }

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

const sendWelcomeTest = async (customText?: string) => {
  const text = (customText || welcomeTestText).trim();
  if (!text || welcomeTestBusy) return;

  setWelcomeTestBusy(true);
  setWelcomeTestMsg('');

  try {
const res = await api<{ ok: true; id: string }>(
  '/api/conversations/test-assistant',
  {
    method: 'POST',
    body: JSON.stringify({
  text,
  conversationId: welcomeTestConversationId || undefined,
}),
  }
);

await refreshList();

setWelcomeTestConversationId(res.id);

if (!isMobile) {
  setSelectedId(res.id);
  await refreshThread(res.id);
} else {
  setPane('list');
}

setWelcomeTestText('');
setWelcomeTestMsg('Test sent. The new conversation is now visible in Inbox.');
  } catch (err: any) {
    setWelcomeTestMsg(err?.message || 'Could not send test message.');
  } finally {
    setWelcomeTestBusy(false);
  }
};

const startWelcomeDrag = (e: React.MouseEvent) => {
  welcomeDragRef.current = {
    dragging: true,
    startX: e.clientX,
    startY: e.clientY,
    startPanelX: welcomePanelPos.x,
    startPanelY: welcomePanelPos.y,
  };

  window.addEventListener('mousemove', moveWelcomeDrag);
  window.addEventListener('mouseup', stopWelcomeDrag);
};

const moveWelcomeDrag = (e: MouseEvent) => {
  const drag = welcomeDragRef.current;
  if (!drag.dragging) return;

  const nextX = drag.startPanelX + (e.clientX - drag.startX);
  const nextY = drag.startPanelY + (e.clientY - drag.startY);

  setWelcomePanelPos({
    x: Math.max(12, Math.min(nextX, window.innerWidth - 380)),
    y: Math.max(72, Math.min(nextY, window.innerHeight - 180)),
  });
};

const stopWelcomeDrag = () => {
  welcomeDragRef.current.dragging = false;
  window.removeEventListener('mousemove', moveWelcomeDrag);
  window.removeEventListener('mouseup', stopWelcomeDrag);
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

    localStorage.setItem(takeoverKey(thread.id), String(Date.now()));

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

const addImagesToReply = async (files: FileList | null) => {
  if (!files || files.length === 0) return;

  if (
    thread?.aiEnabled &&
    !autoTakeoverTriggeredRef.current
  ) {
    autoTakeoverTriggeredRef.current = true;
    await ensureHumanTakeoverForDraft();
  }

  const picked = Array.from(files)
  .filter((file) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please choose JPG, PNG, or WebP images.");
      return false;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose images smaller than 2 MB.");
      return false;
    }

    return true;
  })
  .slice(0, 3);

  const encoded = await Promise.all(
    picked.map(
      (file) =>
        new Promise<any>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            resolve({
              type: 'image',
              name: file.name,
              dataUrl: String(reader.result || ''),
            });
          };

          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );

  setSelectedImages((prev) => [...prev, ...encoded]);
  setTimeout(() => replyRef.current?.focus(), 0);
};

const removeSelectedImage = (index: number) => {
  setSelectedImages((prev) => prev.filter((_, i) => i !== index));
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
  const products = [
  ...selectedProducts,
  ...selectedImages,
];

if (!text && products.length === 0) return;

  setDraft('');
  setSelectedProducts([]);
setSelectedImages([]);
setSuggestedDraft('');

  await api(`/api/conversations/${thread.id}/message`, {
    method: 'POST',
    body: JSON.stringify({
      role: 'staff',
      content: text,
      products,
    }),
  });

  localStorage.setItem(takeoverKey(thread.id), String(Date.now()));

  await refreshThread(thread.id);
  await refreshList();
};

const saveAssistantCoaching = async () => {
  if (!thread) return;

  const guidance = noteDraft.trim();
  if (!guidance) return;

  try {
    await api(`/api/conversations/${thread.id}/message`, {
      method: 'POST',
      body: JSON.stringify({
        role: 'note',
        content: guidance,
        isAssistantCoaching: true,
        saveAsInternalNote: true,
        assistantName: fullAssistantName,
      }),
    });

    setNoteDraft('');
    setNoteModalOpen(false);

    setNoteToast(
      `✓ ${fullAssistantName} learned from your coaching.`
    );

    window.setTimeout(() => {
      setNoteToast('');
    }, 2600);

    await refreshThread(thread.id);
    await refreshList();

    window.setTimeout(() => {
      messagesRef.current?.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 80);
  } catch (error: any) {
    setNoteToast(
      error?.message ||
        'Could not save coaching.'
    );

    window.setTimeout(() => {
      setNoteToast('');
    }, 5000);
  }
};

const generateDraft = async () => {
  if (!thread) return;

  try {
    const res = await fetch(
      `/api/conversations/${thread.id}/draft`,
      {
        method: 'POST',
      }
    );

    const data = await res.json();

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || 'Draft failed');
    }

    setSuggestedDraft(data.draft || '');
  } catch (err) {
    console.error(err);

    setSuggestedDraft(
      'Sorry — AI could not generate a draft right now.'
    );
  }
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
  returnToInboxList();
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

const renderMobileInboxMenu = () => {
  if (!mobileInboxMenuOpen) return null;

  const itemClass = (active: boolean) =>
    ['cx-filterMenuItem', active ? 'active' : ''].filter(Boolean).join(' ');

  return (
    <div className="cx-rightDrawerOverlay" onClick={() => setMobileInboxMenuOpen(false)}>
      <aside className="cx-rightDrawer" onClick={(e) => e.stopPropagation()}>
        <div className="cx-sheetTop">
          <div>
            <div className="cx-sheetTitle">Inbox filters</div>
            <div className="cx-sheetSub">Show conversations by status</div>
          </div>

          <button className="cx-sheetClose" onClick={() => setMobileInboxMenuOpen(false)}>
            ×
          </button>
        </div>

        <div className="cx-sheetActions">
          <button
            className={itemClass(status === 'all' && !showArchived)}
            onClick={() => {
              setStatus('all');
              setShowArchived(false);
              setMobileInboxMenuOpen(false);
            }}
          >
            All conversations
          </button>

          <button
            className={itemClass(status === 'waiting' && !showArchived)}
            onClick={() => {
              setStatus('waiting');
              setShowArchived(false);
              setMobileInboxMenuOpen(false);
            }}
          >
            Waiting
          </button>

          <button
            className={itemClass(status === 'closed' && !showArchived)}
            onClick={() => {
              setStatus('closed');
              setShowArchived(false);
              setMobileInboxMenuOpen(false);
            }}
          >
            Closed
          </button>

          <button
            className={itemClass(showArchived)}
            onClick={() => {
              setStatus('all');
              setShowArchived(true);
              setMobileInboxMenuOpen(false);
            }}
          >
            Archived
          </button>
        </div>
      </aside>
    </div>
  );
};

const renderThreadMenuSheet = () => {
  if (!thread || !threadMenuOpen) return null;

  return (
    <div className="cx-rightDrawerOverlay" onClick={() => setThreadMenuOpen(false)}>
  <aside className="cx-rightDrawer" onClick={(e) => e.stopPropagation()}>
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
  {thread.status !== 'closed' ? (
    <button
      className="db-btn"
      onClick={async () => {
        setThreadMenuOpen(false);
        await setConvStatus('closed');
      }}
    >
      Close
    </button>
  ) : (
    <button
      className="db-btn"
      onClick={async () => {
        setThreadMenuOpen(false);
        await setConvStatus('open');
      }}
    >
      Reopen
    </button>
  )}

  <button
    className="db-btn"
    onClick={async () => {
      setThreadMenuOpen(false);
      await setConvStatus('waiting');
    }}
  >
    Mark waiting
  </button>

  {thread.archivedAt ? (
    <button
      className="db-btn"
      onClick={async () => {
        setThreadMenuOpen(false);
        await restoreThisChat();
      }}
    >
      Restore
    </button>
  ) : (
    <button
      className="db-btn"
      onClick={async () => {
        setThreadMenuOpen(false);
        await archiveThisChat();
      }}
    >
      Archive
    </button>
  )}

<button
  className="db-btn cx-coachBtn"
  onClick={() => {
    setNoteDraft('');
    setNoteModalOpen(true);
  }}
>
  {`Coach ${coachButtonName}`}
</button>
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
  <button className="db-btn cx-tagAddBtn" onClick={addTag}>
    Add
  </button>
</div>
        </div>
      </aside>
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
  <div
  className="cx-avatar"
  style={getAvatarStyle(c.customerName)}
>
  <span className="cx-avatarIcon" />
</div>

  <div className="cx-main">
    <div className="cx-top">
      <div className="cx-customer">{c.customerName || 'Unknown'}</div>
      <div className="cx-time">{fmtTime(c.lastMessageAt)}</div>
    </div>

    <div className="cx-meta">
      <div className="cx-subjectLine">
        {archived && <span className="cx-inlineLabel">Archived</span>}
        <span className={`cx-inlineLabel cx-inlineLabel--${chKey}`}>
  {channelLabel(chKey)}
</span>
        <span className="cx-subjectText">{c.subject || '(no subject)'}</span>
      </div>

      <div className="cx-indicators">
  {c.needsHuman && <span className="cx-dot alert" title="Needs human" />}
  {showActiveCustomerDot && isCustomerActive(c) && (
  <span className="cx-dot unread" title="Customer active now" />
)}
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
        No conversations yet. Send a test message from your widget or Starter Link.
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
      Take over
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
      onClick={returnToInboxList}
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
                  <span className="cx-inlineLabel">
  {currentChannel} · {thread.status === 'open' ? 'Active' : thread.status}
</span>
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
<button
  className="db-btn"
  onClick={() => {
    setNoteDraft('');
    setNoteModalOpen(true);
  }}
>
  {`Coach ${coachButtonName}`}
</button>

<button
  className="db-btn"
  onClick={() => setConvStatus('waiting')}
>
  Mark waiting
</button>

                                <div className="cx-addTagCombo">
  <input
    className="cx-addTagInput"
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

  <button className="cx-addTagButton" onClick={addTag} aria-label="Add tag">
    ↑
  </button>
</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div ref={messagesRef} className="cx-threadMessages">
        <div className="cx-msgList">
{orderedThreadMessages(thread.messages, thread.channel).map((m: any) => {
  const showInsert = m.role === 'note' && isDraftNote(m.content);
  const isEmmaNoted =
    m.role === 'note' && m.content.startsWith('`${assistantName} noted:`');

  return (
              <div key={m.id} style={{ display: 'grid', gap: 6 }}>
<div className="cx-msgMeta">
  <div className="cx-msgMetaLeft">
    <strong>{roleLabel(m.role, assistantName, staffName)}</strong> · {fmtTime(m.createdAt)}
  </div>

{m.role === "assistant" &&
 m.source === "voice" && (
    <div className="cx-msgVoice">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M19 11a7 7 0 0 1-14 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 18v3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M8 21h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <span>Voice</span>
    </div>
  )}
</div>

                <div
className={[
  'cx-bubble',
  m.role === 'assistant' ? 'assistant' : '',
  m.role === 'staff' ? 'agent' : '',
  m.role === 'note' ? 'note' : '',
  isEmmaNoted ? 'emmaNoted' : '',
].filter(Boolean).join(' ')}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>

{Array.isArray((m as any).products) && (m as any).products.length > 0 ? (
  <div className="cx-productList">
    {(m as any).products.map((p: any, idx: number) => {
      if (p?.type === 'image' && p?.dataUrl) {
        return (
          <button
            key={p.name ?? idx}
            type="button"
            className="cx-productRow cx-productRow--clickable"
            onClick={() => {
              setPreviewProduct({
                title: p.name || 'Image',
                image: p.dataUrl,
                price: '',
                available: true,
                url: '#',
              });
            }}
            title="Image preview"
          >
            <div className="cx-productLeft">
              <img
                src={p.dataUrl}
                alt={p.name || 'Attached image'}
                className="cx-productThumb"
              />

              <div className="cx-productMeta">
                <div className="cx-productTitle">{p.name || 'Attached image'}</div>
                <div className="cx-productStock">Image attachment</div>
              </div>
            </div>
          </button>
        );
      }

      const priceText =
        typeof p.price === 'number'
          ? `$${p.price.toFixed(2)}`
          : p.price
            ? String(p.price)
            : '';

      const stockText =
        p.available === false ? 'Unavailable' : 'In stock';

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
  {suggestedDraft ? (
  <div
    style={{
      marginBottom: 6,
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      background: '#f8fafc',
      padding: 8,
      display: 'grid',
      gap: 1,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
      <strong style={{ fontSize: 11 }}>AI's draft — click to insert.</strong>
      <button
  type="button"
  onClick={() => setSuggestedDraft('')}
  style={{
    border: 'none',
    background: 'transparent',
    padding: 2,
    minHeight: 22,
    minWidth: 22,
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    color: '#64748b',
  }}
  aria-label="Close suggested draft"
>
  ×
</button>
    </div>

    <div
  role="button"
  tabIndex={0}
  onClick={() => {
    setDraft(suggestedDraft);
    setSuggestedDraft('');
    setTimeout(() => replyRef.current?.focus(), 0);
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      setDraft(suggestedDraft);
      setSuggestedDraft('');
      setTimeout(() => replyRef.current?.focus(), 0);
    }
  }}
  style={{
  minHeight: 36,
  textAlign: 'left',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  background: '#ffffff',
  color: '#3a3e46ff',
  padding: 10,
  fontSize: 12,
  lineHeight: 1.2,
  cursor: 'pointer',
  whiteSpace: 'pre-wrap',
}}
  title="Click to insert into reply"
>
  {suggestedDraft || "Draft is empty. Try AI's draft again."}
</div>


  </div>
) : null}
  <div className="cx-replyModeBar">
    <div>
  {!thread.aiEnabled && <span className="cx-replyModeHint">AI paused</span>}
  {!isMobile && <span> · Replying as {staffName}</span>}
</div>

    <div className="cx-replyQuickActions">
  {primaryAiAction}

<label className="db-btn" style={{ cursor: 'pointer' }}>
  Add image
  <input
    type="file"
    accept="image/*"
    multiple
    hidden
    onChange={(e) => {
      void addImagesToReply(e.target.files);
      e.currentTarget.value = '';
    }}
  />
</label>

  <button className="db-btn" onClick={generateDraft}>
    AI's draft
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
{selectedImages.length > 0 && (
  <div className="cx-selectedProducts">
    {selectedImages.map((img: any, idx: number) => (
      <div key={`${img.name}-${idx}`} className="cx-selectedProductChip">
        <img
          src={img.dataUrl}
          alt={img.name || 'Selected image'}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            objectFit: 'cover',
            marginRight: 6,
          }}
        />

        <span>{img.name || 'Image'}</span>

        <button
          type="button"
          onClick={() => removeSelectedImage(idx)}
          aria-label={`Remove ${img.name || 'image'}`}
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
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
  <rect
    x="4"
    y="3"
    width="16"
    height="18"
    rx="2"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  />
  <line
    x1="10"
    y1="3"
    x2="10"
    y2="21"
    stroke="currentColor"
    strokeWidth="2"
  />
</svg>
</button>

      <div className="cx-mobileInboxTitle">Inbox</div>

<button
  type="button"
  className="cx-mobileTopBtn"
  aria-label="Inbox filters"
  onClick={() => setMobileInboxMenuOpen(true)}
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

    <div className="cx-mobileList" ref={mobileListRef}>
      {renderConversationList()}
    </div>
  </div>
);

const renderDesktopLayout = () => (
  <>
<div className="db-topSplit">
  <div className="db-topLeft">
    <h1 className="db-title">Inbox</h1>

    <div className="db-row">
      <button className={aiDefault ? 'db-btn primary' : 'db-btn'} onClick={toggleAiDefault}>
        AI: {aiDefault ? 'On' : 'Off'}
      </button>

      <button className={showArchived ? 'db-btn primary' : 'db-btn'} onClick={() => setShowArchived((v) => !v)}>
        Inbox: {showArchived ? 'All' : 'Active'}
      </button>

      <select className="db-btn" value={status} onChange={(e) => setStatus(e.target.value as any)}>
        <option value="all">All</option>
        <option value="open">Open</option>
        <option value="waiting">Waiting</option>
        <option value="closed">Closed</option>
      </select>
    </div>

    <input
      className="db-search"
      placeholder="Search conversations…"
      value={q}
      onChange={(e) => setQ(e.target.value)}
    />
  </div>

  <div className="db-topRight">
    {thread ? (
      <div className="cx-topThreadHead">
<div className="cx-topThreadMain">
  <div className="cx-threadName">
    {thread.customerName || thread.subject || 'Conversation'}
  </div>

  <div className="cx-threadMeta">
    <span className="cx-inlineLabel">
      {currentChannel} · {thread.status === 'open' ? 'Active' : thread.status}
    </span>
  </div>

  <div className="cx-tagRow">
    {(thread.tags || [])
      .filter((t: any) => !(
        typeof t === "string" &&
        ["starter-link", "no-website", "widget-test", "order-status"].includes(t)
      ))
      .map((t: any) => (
        <span className="cx-chip" key={t}>
          {typeof t === "string" ? t.charAt(0).toUpperCase() + t.slice(1) : t}
          <button onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>
            ×
          </button>
        </span>
      ))}
  </div>
</div>

        <div className="cx-topThreadActions">
<button
  className="db-btn"
  onClick={() => {
    setNoteDraft('');
    setNoteModalOpen(true);
  }}
>
  {`Coach ${coachButtonName}`}
</button>

<button
  className="db-btn"
  onClick={() => setConvStatus('waiting')}
>
  Mark waiting
</button>

          <div className="cx-addTagCombo">
            <input
              className="cx-addTagInput"
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

            <button className="cx-addTagButton" onClick={addTag} aria-label="Add tag">
              ↑
            </button>
          </div>
        </div>
      </div>
    ) : null}
  </div>
</div>

    <div className="cx-split">
  <div className="cx-listPane" ref={desktopListRef}>
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

const renderWelcomeTestModal = () => {
  if (!welcomeTestOpen) return null;

  const prompts = [
    'Where is my order?',
    'What is your return policy?',
    'Do you have this in another size?',
  ];

  if (welcomeTestMinimized) {
    return (
      <button
        type="button"
        onClick={() => setWelcomeTestMinimized(false)}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 9999,
          border: '1px solid rgba(255,255,255,.18)',
          borderRadius: 999,
          padding: '12px 16px',
          background: '#111827',
          color: '#fff',
          fontSize: 14,
          fontWeight: 800,
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.28)',
          cursor: 'pointer',
        }}
      >
        Test Assistant
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: welcomePanelPos.x,
        top: welcomePanelPos.y,
        zIndex: 9999,
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        borderRadius: 22,
        border: '1px solid #e5e7eb',
        background: '#fff',
        boxShadow: '0 24px 70px rgba(15, 23, 42, 0.22)',
        padding: 18,
      }}
    >
      <div
        onMouseDown={startWelcomeDrag}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
  {`Practice with ${fullAssistantName}`}
</div>
          <p style={{ marginTop: 8, fontSize: 13, color: '#64748b', lineHeight: 1.55 }}>
            Ask a shopper-style question and practice with {fullAssistantName}. The conversation will appear in the inbox.
          </p>
        </div>

        <button
  type="button"
  onMouseDown={(e) => e.stopPropagation()}
  onClick={() => {
    setWelcomeTestOpen(false);
    setWelcomeTestMinimized(false);
  }}
  style={{
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    fontSize: 20,
    cursor: 'pointer',
    padding: 4,
    lineHeight: 1,
  }}
  aria-label="Close"
  title="Close"
>
  ×
</button>
      </div>

      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="db-btn"
            disabled={welcomeTestBusy}
            onClick={() => sendWelcomeTest(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <textarea
        value={welcomeTestText}
        onChange={(e) => setWelcomeTestText(e.target.value)}
        onKeyDown={(e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    void sendWelcomeTest();
  }
}}
        placeholder="Type as a customer…"
        rows={4}
        style={{
          marginTop: 14,
          width: '100%',
          border: '1px solid #d1d5db',
          borderRadius: 16,
          padding: 12,
          fontSize: 14,
          resize: 'vertical',
        }}
      />

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <button
          type="button"
          className="db-btn"
          onClick={() => setWelcomeTestMinimized(true)}
        >
          Minimize
        </button>

        <button
          type="button"
          className="db-btn primary"
          disabled={welcomeTestBusy || !welcomeTestText.trim()}
          onClick={() => sendWelcomeTest()}
        >
          {welcomeTestBusy ? 'Sending…' : 'Send'}
        </button>
      </div>

      {welcomeTestMsg ? (
        <p style={{ marginTop: 12, fontSize: 13, color: '#065f46' }}>
          {welcomeTestMsg}
        </p>
      ) : null}
    </div>
  );
};

return (
  <div className={["cx-mobileRoot", blinkRedDot ? "" : "cx-noBlink"].filter(Boolean).join(" ")}>
    {isMobile ? renderMobileLayout() : renderDesktopLayout()}

    {renderProductModal()}
    {renderProductPicker()}
    {renderMobileInboxMenu()}
    {renderThreadMenuSheet()}
    {renderWelcomeTestModal()}

    {noteModalOpen ? (
      <div className="cx-modalOverlay" onClick={() => setNoteModalOpen(false)}>
        <div className="cx-modal" onClick={(e) => e.stopPropagation()}>
          <button
            className="cx-modalClose"
            onClick={() => setNoteModalOpen(false)}
          >
            ×
          </button>

<div className="cx-modalTitle">
  {`Coach ${fullAssistantName}`}
</div>

<p className="cx-noteSub">
  {`Tell ${fullAssistantName} how to handle similar situations in the future.`}
</p>

<textarea
  className="cx-noteTextarea"
  value={noteDraft}
  onChange={(e) => setNoteDraft(e.target.value)}
  placeholder={`Explain what ${fullAssistantName} should do differently next time…`}
  autoFocus
/>

<p className="cx-notePrivacy">
  Visible only to your team in this conversation.
</p>

<div className="cx-noteActions">
  <button
    className="db-btn"
    onClick={() => setNoteModalOpen(false)}
  >
    Cancel
  </button>

  <button
    className="db-btn primary"
    onClick={saveAssistantCoaching}
    disabled={!noteDraft.trim()}
  >
    Save coaching
  </button>
</div>
        </div>
      </div>
    ) : null}

    {noteToast ? (
      <div className="cx-noteToast">{noteToast}</div>
    ) : null}
  </div>
);
}