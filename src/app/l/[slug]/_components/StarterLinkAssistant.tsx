// src/app/l/[slug]/_components/StarterLinkAssistant.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Orb } from "@/components/Orb";
import { OrbLarge } from "@/components/OrbLarge";
import { requestMicPermission } from "@/lib/audio-permission";
import { connectRealtime, type RealtimeConnection } from "@/lib/realtime-webrtc";
import type { VoiceSessionState } from "@/lib/voice-state";

type ChatProduct = {
  id: string;
  title: string;
  price?: number;
  image?: string;
  available?: boolean;
  url?: string;
};

type AssistantMessage = {
  id: string;
  role: "assistant" | "user" | "staff";
speakerName?: string;
  text: string;
  products?: ChatProduct[];
};

type WidgetVoiceSettings = {
  enabled: boolean;
  pack: string | null;
  usedMinutes: number;
  limitMinutes: number;
  remainingMinutes: number;
  utilizationPct: number;
  periodStart: string | null;
};

type LauncherAppearance = "orb" | "avatar" | "bubble";
type AssistantAppearance = "orb" | "avatar";

type Props = {
  publicKey: string;
  assistantName: string;
  assistantIdentity?: string;
  greeting?: string;
  premium?: boolean;
  brandColor?: string;
  desktopDocked?: boolean;
};

const CHAT_WELCOME =
  "Hi! I can help with products, order tracking, shipping, and returns.";

const THINK_PAUSE_MS = 650;
const PACE_INTERVAL_MS = 30;
const PACE_CHARS_PER_TICK = 2;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeVoiceText(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.?!。！？]+$/g, "")
    .replace(/\s+/g, " ");
}

function getOpenKey(publicKey: string) {
  return `tz_assistant_open_${publicKey}`;
}

function getConversationKey(publicKey: string) {
  return `tz_starter_link_conversation_${publicKey}`;
}

const FREE_VOICE_DAILY_LIMIT = 20;

function getVoiceKey(publicKey: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `tz_voice_${publicKey}_${today}`;
}

function getVoiceCount(publicKey: string) {
  try {
    return Number(localStorage.getItem(getVoiceKey(publicKey)) || "0");
  } catch {
    return 0;
  }
}

function incrementVoiceCount(publicKey: string) {
  try {
    const next = getVoiceCount(publicKey) + 1;
    localStorage.setItem(getVoiceKey(publicKey), String(next));
  } catch {}
}

function getVisitorName(publicKey: string) {
  try {
    const key = `tz_link_visitor_${publicKey}`;
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const next = `Link visitor ${Math.random().toString(16).slice(2, 6)}`;
    localStorage.setItem(key, next);
    return next;
  } catch {
    return "Link visitor";
  }
}

function getContrastTextColor(hex: string) {
  const clean = hex.replace("#", "").trim();

  // Keep the bright TikoZap blue paired with white text.
  if (clean.toUpperCase() === "38BDF8") return "#ffffff";

  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return "#ffffff";

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 150 ? "#374151" : "#ffffff";
}

export default function StarterLinkAssistant({
  publicKey,
  assistantName,
  assistantIdentity = "Female",
  greeting,
  premium = false,
  brandColor = "#111827",
  desktopDocked = false,
}: Props) {
  const welcomeText = greeting?.trim() || CHAT_WELCOME;

  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "a-welcome",
      role: "assistant",
      text: welcomeText,
    },
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [composerMode, setComposerMode] = useState<"type" | "speak">("type");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [holdingToTalk, setHoldingToTalk] = useState(false);
  const [lastInputMethod, setLastInputMethod] = useState<"type" | "speak">("type");
  const [isMobileView, setIsMobileView] = useState(false);
const [orbOpen, setOrbOpen] = useState(false);
const [liveTranscript, setLiveTranscript] = useState("");
const [voiceState, setVoiceState] = useState<VoiceSessionState>("idle");
const [assistantVoiceTranscript, setAssistantVoiceTranscript] = useState("");
const [voiceQuotaNotice, setVoiceQuotaNotice] = useState("");
const [widgetVoice, setWidgetVoice] = useState<WidgetVoiceSettings | null>(null);
const [assistantAvatarUrl, setAssistantAvatarUrl] = useState("");
const [launcherAppearance, setLauncherAppearance] =
  useState<LauncherAppearance>("orb");
const [chatAppearance, setChatAppearance] =
  useState<AssistantAppearance>("orb");
const [voiceAppearance, setVoiceAppearance] =
  useState<AssistantAppearance>("orb");

const canUseAvatar = Boolean(assistantAvatarUrl.trim());
const resolvedLauncherAppearance =
  launcherAppearance === "avatar" && !canUseAvatar
    ? "orb"
    : launcherAppearance;
const resolvedChatAppearance =
  chatAppearance === "avatar" && !canUseAvatar ? "orb" : chatAppearance;
const resolvedVoiceAppearance =
  voiceAppearance === "avatar" && !canUseAvatar ? "orb" : voiceAppearance;

const hasOrbTranscript =
  !!liveTranscript.trim() ||
  !!assistantVoiceTranscript.trim() ||
  voiceState === "error";

const messagesRef = useRef<HTMLDivElement | null>(null);
const endRef = useRef<HTMLDivElement | null>(null);
const inputRef = useRef<HTMLTextAreaElement | null>(null);
const panelRef = useRef<HTMLElement | null>(null);
const keepSpeakModeRef = useRef(false);
const abortRef = useRef<AbortController | null>(null);
const revealTimerRef = useRef<number | null>(null);
const pendingTextRef = useRef("");
const recognitionRef = useRef<any>(null);
const transcriptRef = useRef("");
const recognitionTimeoutRef = useRef<number | null>(null);
const orbOpenRef = useRef(false);
const voiceCountedThisSessionRef = useRef(false);
const lastUserVoiceSavePromiseRef = useRef<Promise<string | null> | null>(null);
const lastUserVoiceMessageIdRef = useRef<string | null>(null);
const voiceConversationIdRef = useRef<string | null>(null);

const realtimeConnRef = useRef<RealtimeConnection | null>(null);
const assistantTranscriptBufferRef = useRef("");
const lastSavedUserVoiceRef = useRef("");
const lastSavedAssistantVoiceRef = useRef("");

const voiceTextHandoffPendingRef = useRef(false);
const voiceTextHandoffApprovedRef = useRef(false);

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
  requestAnimationFrame(() => {
    const el = messagesRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
  });
}

function dismissKeyboard() {
  if (typeof document === "undefined") return;
  const el = document.activeElement as HTMLElement | null;
  el?.blur?.();
}

  function startRevealPump() {
    if (revealTimerRef.current !== null) return;

    revealTimerRef.current = window.setInterval(() => {
      const pending = pendingTextRef.current;
      if (!pending) return;

      const chunk = pending.slice(0, PACE_CHARS_PER_TICK);
      pendingTextRef.current = pending.slice(PACE_CHARS_PER_TICK);

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = {
            ...last,
            text: (last.text ?? "") + chunk,
          };
        }
        return copy;
      });
    }, PACE_INTERVAL_MS);
  }

  function stopRevealPump() {
    if (revealTimerRef.current !== null) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }

useEffect(() => {
  if (!publicKey) return;

  let cancelled = false;

  async function loadWidgetSettings() {
    try {
      const res = await fetch(
        `/api/widget/public/settings?key=${encodeURIComponent(publicKey)}`,
        { cache: "no-store" }
      );

      const data = await res.json().catch(() => null);

      if (cancelled || !data?.ok) return;

      if (data.widget?.voice) {
        setWidgetVoice(data.widget.voice);
      }

      setAssistantAvatarUrl(data.widget?.assistantAvatarUrl || "");
      setLauncherAppearance(
        data.widget?.launcherAppearance === "avatar" ||
          data.widget?.launcherAppearance === "bubble"
          ? data.widget.launcherAppearance
          : "orb"
      );
      setChatAppearance(
        data.widget?.chatAppearance === "avatar" ? "avatar" : "orb"
      );
      setVoiceAppearance(
        data.widget?.voiceAppearance === "avatar" ? "avatar" : "orb"
      );
    } catch {}
  }

  void loadWidgetSettings();

  return () => {
    cancelled = true;
  };
}, [publicKey]);

useEffect(() => {
  voiceConversationIdRef.current = conversationId;
}, [conversationId]);

  useEffect(() => {
  orbOpenRef.current = orbOpen;
}, [orbOpen]);

useEffect(() => {
  return () => {
    abortRef.current?.abort();
    stopRevealPump();
    stopRealtimeVoiceSession();
  };
}, []);

useEffect(() => {
  if (!orbOpen) {
    stopRealtimeVoiceSession();
  }
}, [orbOpen]);

useEffect(() => {
  if (!open) {
    stopRealtimeVoiceSession();
  }
}, [open]);

useEffect(() => {
  if (!voiceQuotaNotice) return;

  const timer = window.setTimeout(() => {
    setVoiceQuotaNotice(
  "Daily free voice limit reached. Please continue chatting by text, or try voice again tomorrow."
);
  }, 3200);

  return () => window.clearTimeout(timer);
}, [voiceQuotaNotice]);

  useEffect(() => {
  if (!open) return;

  const t1 = window.setTimeout(() => scrollToBottom("auto"), 40);

  return () => {
    window.clearTimeout(t1);
  };
}, [open]);

useEffect(() => {
  try {
    window.parent?.postMessage(
      {
        type: "TIKOZAP_WIDGET_STATE",
        open,
      },
      "*"
    );
  } catch {}
}, [open]);

useEffect(() => {
  if (!open) return;

  scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
}, [messages, open, sending]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(getConversationKey(publicKey));

if (stored && !stored.startsWith("conv_")) {
  setConversationId(stored);
} else if (stored?.startsWith("conv_")) {
  localStorage.removeItem(getConversationKey(publicKey));
  setConversationId(null);
}
    } catch {}
  }, [publicKey]);

  useEffect(() => {
  if (!open || !conversationId) return;

  let cancelled = false;

  async function pollThread() {
    if (sending) return;

    try {
      const res = await fetch(
  `/api/widget/public/thread?key=${encodeURIComponent(publicKey)}&conversationId=${encodeURIComponent(conversationId || "")}&t=${Date.now()}`,
  { cache: "no-store" }
);

      const data = await res.json().catch(() => null);
      if (!data?.ok || !Array.isArray(data.messages) || cancelled) return;

      setMessages(
        data.messages.map((m: any) => ({
          id: m.id,
          role:
            m.role === "customer"
              ? "user"
              : m.role === "staff"
                ? "staff"
                : "assistant",
          text: m.content,
          products: m.products || [],
          speakerName: m.role === "staff" ? "Kevin" : undefined,
        }))
      );
    } catch {}
  }

  void pollThread();
 const timer = window.setInterval(() => {
  if (document.hidden) return;
  void pollThread();
}, 10000);

  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}, [open, conversationId, publicKey, sending]);

function clearRecognitionTimeout() {
  if (recognitionTimeoutRef.current !== null) {
    window.clearTimeout(recognitionTimeoutRef.current);
    recognitionTimeoutRef.current = null;
  }
}

useEffect(() => {
  if (typeof window === "undefined") return;

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event: any) => {
    let text = "";

    for (let i = 0; i < event.results.length; i++) {
      text += event.results[i][0].transcript;
    }

    const next = text.trim();
    transcriptRef.current = next;
    setLiveTranscript(next);
  };


  clearRecognitionTimeout();
  recognition.onend = () => {
    const spoken = transcriptRef.current.trim();

    setHoldingToTalk(false);

    try {
  recognition.abort?.();
} catch {}

    if (!spoken) {
      setLiveTranscript("");
      return;
    }

    setLastInputMethod("speak");
    setInput(spoken);
    setLiveTranscript(spoken);
    keepSpeakModeRef.current = true;

    if (orbOpenRef.current) {
      setComposerMode("speak");
      setTimeout(() => {
        sendMessage(spoken);
      }, 80);
    } else {
      setComposerMode("type");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  clearRecognitionTimeout();
  recognition.onerror = (event: any) => {
    console.log("[speech] error:", event?.error);
    setHoldingToTalk(false);
  };

  recognitionRef.current = recognition;

  return () => {
    try {
      recognition.stop();
    } catch {}

    recognitionRef.current = null;
  };
}, [conversationId, publicKey]);

useEffect(() => {
  if (typeof window === "undefined") return;
  if (!open || window.innerWidth >= 900) return;

  const html = document.documentElement;
  const body = document.body;

  const previousHtmlOverflow = html.style.overflow;
  const previousBodyOverflow = body.style.overflow;
  const previousBodyOverscrollBehavior = body.style.overscrollBehavior;

  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  body.style.overscrollBehavior = "none";

  return () => {
    html.style.overflow = previousHtmlOverflow;
    body.style.overflow = previousBodyOverflow;
    body.style.overscrollBehavior = previousBodyOverscrollBehavior;
  };
}, [open]);

useEffect(() => {
  if (typeof window === "undefined") return;

  // In the embedded widget, widget.js resizes the iframe.
  // Keep this visual viewport logic only for /l/[slug].
  if (window.self !== window.top) return;

  if (!open || window.innerWidth >= 900) return;

  const panel = panelRef.current;
  const viewport = window.visualViewport;

  if (!panel || !viewport) return;

  function syncPanelToVisibleViewport() {
    const currentPanel = panelRef.current;
    const currentViewport = window.visualViewport;

    if (!currentPanel || !currentViewport) return;

    currentPanel.style.setProperty(
      "--sl-visible-top",
      `${currentViewport.offsetTop}px`
    );

    currentPanel.style.setProperty(
      "--sl-visible-height",
      `${currentViewport.height}px`
    );
  }

  syncPanelToVisibleViewport();

  viewport.addEventListener("resize", syncPanelToVisibleViewport);
  viewport.addEventListener("scroll", syncPanelToVisibleViewport);

  return () => {
    viewport.removeEventListener("resize", syncPanelToVisibleViewport);
    viewport.removeEventListener("scroll", syncPanelToVisibleViewport);

    panel.style.removeProperty("--sl-visible-top");
    panel.style.removeProperty("--sl-visible-height");
  };
}, [open]);

useEffect(() => {
  function updateIsMobile() {
    setIsMobileView(window.innerWidth < 900);
  }

  updateIsMobile();
  window.addEventListener("resize", updateIsMobile);

  return () => window.removeEventListener("resize", updateIsMobile);
}, []);

useEffect(() => {
  try {
    const saved = localStorage.getItem(getOpenKey(publicKey));

    if (saved === "1") {
      setOpen(true);
      return;
    }

    if (saved === "0") {
      setOpen(false);
      return;
    }

    if (desktopDocked && !isMobileView) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  } catch {
    setOpen(desktopDocked && !isMobileView);
  }
}, [publicKey, desktopDocked, isMobileView]);

useEffect(() => {
  try {
    localStorage.setItem(getOpenKey(publicKey), open ? "1" : "0");
  } catch {}
}, [publicKey, open]);

useEffect(() => {
  if (!desktopDocked) return;

  if (!isMobileView) {
    setOpen(true);   // desktop → open
  } else {
    setOpen(false);  // mobile → closed
  }
}, [desktopDocked, isMobileView]);

useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

const orbState = useMemo(() => {
  if (orbOpen && composerMode === "speak") {
    if (voiceState === "listening") return "listening";
    if (voiceState === "thinking" || voiceState === "permission") return "thinking";
    if (voiceState === "speaking") return "speaking";
    if (voiceState === "error") return "sad";
  }

  if (sending) return "thinking";
  return "idle";
}, [sending, orbOpen, composerMode, voiceState]);

  const hasText = input.trim().length > 0;
  const isSpeakMode = composerMode === "speak";


function startVoiceCapture() {
  const recognition = recognitionRef.current;

  if (!recognition || sending) return;

  clearRecognitionTimeout();

  transcriptRef.current = "";
  setLiveTranscript("");
  setHoldingToTalk(true);

  try {
    recognition.start();

    recognitionTimeoutRef.current = window.setTimeout(() => {
      try {
        recognition.stop();
      } catch {
        try {
          recognition.abort?.();
        } catch {}
      }
    }, 8000);
  } catch (error) {
    console.error("[speech] start failed:", error);
    setHoldingToTalk(false);
  }
}

function stopVoiceCapture() {
  clearRecognitionTimeout();
  setHoldingToTalk(false);

  const recognition = recognitionRef.current;

  try {
    recognition?.stop();
  } catch {
    try {
      recognition?.abort?.();
    } catch {}
  }
}

function toggleTextSpeechCapture() {
  if (holdingToTalk) {
    stopVoiceCapture();
    return;
  }

  setLastInputMethod("speak");
  setComposerMode("speak");
  inputRef.current?.blur();
  startVoiceCapture();
}

function stopRealtimeVoiceSession(options?: { preserveAssistantText?: boolean }) {
  const preserveAssistantText = options?.preserveAssistantText ?? false;

  setVoiceState("idle");
  setLiveTranscript("");

  if (!preserveAssistantText) {
    assistantTranscriptBufferRef.current = "";
    setAssistantVoiceTranscript("");
  }

  if (realtimeConnRef.current) {
    try {
      realtimeConnRef.current.dc.close();
    } catch {}

    try {
      realtimeConnRef.current.pc.getSenders().forEach((sender) => {
        sender.track?.stop();
      });
    } catch {}

    try {
      realtimeConnRef.current.pc.close();
    } catch {}

    try {
      realtimeConnRef.current.audioEl.pause();
      realtimeConnRef.current.audioEl.srcObject = null;
    } catch {}

    realtimeConnRef.current = null;
  }
}

async function saveVoiceMessage(
  role: "customer" | "assistant",
  content: string,
  existingMessageId?: string,
  customerContent?: string
) {
  const text = content.trim();
  if (!text) return null;

  try {
    const res = await fetch("/api/widget/public/voice-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicKey,
        conversationId: voiceConversationIdRef.current || conversationId,
        messageId: existingMessageId,
        role,
        content: text,
        customerContent,
        channel: "starter-link-voice",
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      if (data?.reason === "VOICE_LIMIT_REACHED" || res.status === 402) {
        stopRealtimeVoiceSession({ preserveAssistantText: true });
        setComposerMode("type");
        setVoiceState("error");
        setVoiceQuotaNotice(
          data?.error ||
            "Daily free voice limit reached. Please continue chatting by text, or try voice again tomorrow."
        );
      }

      return null;
    }

    if (data?.conversationId && !conversationId) {
      voiceConversationIdRef.current = data.conversationId;
      setConversationId(data.conversationId);

      try {
        localStorage.setItem(
          getConversationKey(publicKey),
          data.conversationId
        );
      } catch {}
    }

    return data?.messageId || null;
  } catch {
    return null;
  }
}

function assistantOfferedTextHandoff(text: string) {
  const value = text.toLowerCase();

  const mentionsText =
    value.includes("text chat") ||
    value.includes("chat");

  const suggestsTransition =
    value.includes("switch") ||
    value.includes("jump over") ||
    value.includes("move over") ||
    value.includes("continue there") ||
    value.includes("continue in text") ||
    value.includes("continue in chat");

  return mentionsText && suggestsTransition;
}

function userApprovedTextHandoff(text: string) {
  const value = text.trim().toLowerCase();

  return /^(yes|yes please|yeah|yep|sure|okay|ok|please do|go ahead|sounds good)[.!]?$/i.test(
    value
  );
}

function userDeclinedTextHandoff(text: string) {
  const value = text.trim().toLowerCase();

  return /^(no|no thanks|no thank you|not now|stay here|keep talking)[.!]?$/i.test(
    value
  );
}

async function startRealtimeVoiceSession() {
  const voiceEnabled = widgetVoice?.enabled === true;
  const remainingPaidMinutes = widgetVoice?.remainingMinutes ?? 0;

  if (voiceEnabled && remainingPaidMinutes <= 0) {
    stopRealtimeVoiceSession({ preserveAssistantText: true });
    setComposerMode("type");
    setVoiceState("error");
    setVoiceQuotaNotice(
      "Realtime Voice Concierge minutes are used up for this month. Please continue in text chat."
    );
    return;
  }

  if (!voiceEnabled) {
    const used = getVoiceCount(publicKey);

    if (used >= FREE_VOICE_DAILY_LIMIT) {
      stopRealtimeVoiceSession({ preserveAssistantText: true });
      setComposerMode("type");
      setVoiceState("error");
      setVoiceQuotaNotice(
        "Today’s free voice limit reached. Please continue in text chat."
      );
      return;
    }
  }

  voiceCountedThisSessionRef.current = false;

  if (
    realtimeConnRef.current ||
    voiceState === "permission" ||
    voiceState === "listening" ||
    voiceState === "thinking" ||
    voiceState === "speaking"
  ) {
    return;
  }

  setLastInputMethod("speak");
  setComposerMode("speak");
  setLiveTranscript("");
  assistantTranscriptBufferRef.current = "";
  setAssistantVoiceTranscript("");
  setVoiceState("permission");

  const permission = await requestMicPermission();

  if (!permission.ok) {
    setVoiceState("error");
    setAssistantVoiceTranscript("Microphone access was denied or unsupported.");
    return;
  }

  setVoiceState("permission");
setAssistantVoiceTranscript("");

  try {
const res = await fetch("/api/realtime/session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
  mode: "merchant",
  publicKey,
  assistantIdentity,
}),
});

    const data = await res.json().catch(() => ({}));

if (!res.ok || !data?.ok) {
  if (
    res.status === 402 ||
    data?.reason ===
      "VOICE_LIMIT_REACHED"
  ) {
    stopRealtimeVoiceSession({
      preserveAssistantText: true,
    });

    setComposerMode("type");
    setVoiceState("error");

    setVoiceQuotaNotice(
      data?.error ||
        "Today’s free Voice limit has been reached. Please continue by text or try Voice again tomorrow."
    );

    return;
  }

  setVoiceState("error");

  setAssistantVoiceTranscript(
    data?.error ||
      "Failed to create realtime voice session."
  );

  return;
}

    if (!data?.client_secret?.value) {
      setVoiceState("error");
      setAssistantVoiceTranscript("Missing realtime client secret.");
      return;
    }

    const conn = await connectRealtime(data.client_secret.value, {
      onUserTranscript: (text) => {
  const trimmed = text.trim();
  if (!trimmed) return;

  if (!voiceCountedThisSessionRef.current) {
    if (!widgetVoice?.enabled) {
      const used = getVoiceCount(publicKey);

      if (used >= FREE_VOICE_DAILY_LIMIT) {
        stopRealtimeVoiceSession({ preserveAssistantText: true });
        setComposerMode("type");
        setVoiceState("error");
        setVoiceQuotaNotice(
          "Today’s free voice limit reached. Please continue in text chat."
        );
        return;
      }

const next = used + 1;

if (next === 3) {
  setVoiceQuotaNotice(
    "Voice session note: 2 free voice questions remaining today."
  );
} else if (next === 4) {
  setVoiceQuotaNotice(
    "Voice session note: 1 free voice question remaining today."
  );
} else if (next === 5) {
  setVoiceQuotaNotice(
    "This is today’s final free voice question."
  );
}

      incrementVoiceCount(publicKey);
    }

    voiceCountedThisSessionRef.current = true;
  }

  setLiveTranscript(trimmed);
  transcriptRef.current = trimmed;
  if (voiceTextHandoffPendingRef.current) {
  if (userApprovedTextHandoff(trimmed)) {
    voiceTextHandoffApprovedRef.current = true;
  } else if (userDeclinedTextHandoff(trimmed)) {
    voiceTextHandoffPendingRef.current = false;
    voiceTextHandoffApprovedRef.current = false;
  }
}
},


      onAssistantTranscript: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const prev = assistantTranscriptBufferRef.current.trim();

        if (!prev) {
          assistantTranscriptBufferRef.current = trimmed;
        } else if (trimmed === prev) {
          return;
        } else if (trimmed.startsWith(prev)) {
          assistantTranscriptBufferRef.current = trimmed;
        } else if (prev.startsWith(trimmed)) {
          return;
        } else {
          assistantTranscriptBufferRef.current = trimmed;
        }

        setAssistantVoiceTranscript(assistantTranscriptBufferRef.current);
      },

onUserSpeechStart: () => {
  voiceCountedThisSessionRef.current = false;
  lastUserVoiceSavePromiseRef.current = null;
  lastUserVoiceMessageIdRef.current = null;
  lastSavedUserVoiceRef.current = "";

  transcriptRef.current = "";
  setLiveTranscript("");

  setVoiceState("listening");
},

onUserSpeechStop: () => {
  const finalText =
    transcriptRef.current.trim() ||
    liveTranscript.trim();

  if (finalText) {
    lastSavedUserVoiceRef.current = finalText;

    if (voiceTextHandoffPendingRef.current) {
      if (userApprovedTextHandoff(finalText)) {
        voiceTextHandoffApprovedRef.current = true;
      } else if (userDeclinedTextHandoff(finalText)) {
        voiceTextHandoffPendingRef.current = false;
        voiceTextHandoffApprovedRef.current = false;
      }
    }
  }

  setVoiceState("thinking");
},

onAssistantSpeechStart: () => {
  assistantTranscriptBufferRef.current = "";
  setAssistantVoiceTranscript("");
  setVoiceState("speaking");
},

onAssistantSpeechStop: async () => {
  await sleep(500);

  const assistantText =
    assistantTranscriptBufferRef.current.trim();

  const userText =
    transcriptRef.current.trim() ||
    liveTranscript.trim();

  if (
    userText &&
    assistantText &&
    assistantText !==
      lastSavedAssistantVoiceRef.current
  ) {
    lastSavedAssistantVoiceRef.current =
      assistantText;

    await saveVoiceMessage(
      "assistant",
      assistantText,
      undefined,
      userText
    );
  }

  if (
    assistantText &&
    assistantOfferedTextHandoff(assistantText)
  ) {
    voiceTextHandoffPendingRef.current = true;
  }

  if (voiceTextHandoffApprovedRef.current) {
    voiceTextHandoffPendingRef.current = false;
    voiceTextHandoffApprovedRef.current = false;

    stopRealtimeVoiceSession({
      preserveAssistantText: true,
    });

    setComposerMode("type");
    setOrbOpen(false);

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return;
  }

  setVoiceState("listening");
},

      onInterrupted: () => {
        assistantTranscriptBufferRef.current = "";
        setAssistantVoiceTranscript("");
        setVoiceState("listening");
      },

      onError: (message) => {
        setVoiceState("error");
        setAssistantVoiceTranscript(message);
      },
    });

    realtimeConnRef.current = conn;
    setVoiceState("listening");
    setLiveTranscript("");
    setAssistantVoiceTranscript("");
  } catch (e: any) {
    setVoiceState("error");
    setAssistantVoiceTranscript(e?.message || "Voice session setup failed.");
  }
}

function toggleRealtimeVoiceSession() {
  if (realtimeConnRef.current) {
    stopRealtimeVoiceSession({ preserveAssistantText: true });
    return;
  }

  startRealtimeVoiceSession();
}

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
setInput("");
if (keepSpeakModeRef.current) {
  setComposerMode("speak");
  keepSpeakModeRef.current = false;
}
setLiveTranscript("");

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: "user",
        text: trimmed,
      },
      {
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role: "assistant",
        text: "",
      },
    ]);

    pendingTextRef.current = "";
    stopRevealPump();

    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = Date.now();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          conversationId,
          publicKey,
          channel: desktopDocked ? "starter-link" : "web",
tags: desktopDocked ? ["starter-link", "no-website"] : ["widget"],
          visitor: {
            name: getVisitorName(publicKey),
          },
        }),
        signal: controller.signal,
      });

if (!res.ok) {
  const data = await res.json().catch(() => ({}));

  if (res.status === 402 && data?.reason === "TRIAL_EXPIRED") {
    setMessages((prev) => {
      const copy = [...prev];

      copy[copy.length - 1] = {
        id: copy[copy.length - 1]?.id ?? `a-expired-${Date.now()}`,
        role: "assistant",
        text:
          data?.error ||
          "This store’s TikoZap trial has ended.",
      };

      return copy;
    });

    return;
  }

  throw new Error(
    data?.error ||
      data?.detail ||
      `HTTP ${res.status}`
  );
}

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const elapsed = Date.now() - startedAt;
      if (elapsed < THINK_PAUSE_MS) {
        await sleep(THINK_PAUSE_MS - elapsed);
      }

      startRevealPump();

      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() || "";

        for (const chunk of chunks) {
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;

          const payload = JSON.parse(line.slice(6));

          if (payload.type === "meta") {
            if (payload.conversationId) {
              setConversationId(payload.conversationId);
              try {
                localStorage.setItem(
                  getConversationKey(publicKey),
                  payload.conversationId
                );
              } catch {}
            }
          }

          if (payload.type === "delta" && payload.delta) {
            pendingTextRef.current += payload.delta;
          }

          if (payload.type === "final") {
            if (Array.isArray(payload.products) && payload.products.length > 0) {
              setMessages((prev) => {
                const next = [...prev];
                for (let i = next.length - 1; i >= 0; i--) {
                  if (next[i].role === "assistant") {
                    next[i] = {
                      ...next[i],
                      products: payload.products,
                    };
                    break;
                  }
                }
                return next;
              });
            }
          }
        }
      }

      while (pendingTextRef.current.length > 0) {
        await sleep(PACE_INTERVAL_MS);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            id: copy[copy.length - 1]?.id ?? `a-net-${Date.now()}`,
            role: "assistant",
            text: "Sorry—something went wrong. Please try again.",
          };
          return copy;
        });
      }
    } finally {
      abortRef.current = null;
      stopRevealPump();
      pendingTextRef.current = "";
      setSending(false);

if (lastInputMethod === "speak") {
  setComposerMode("speak");
} else {
  setComposerMode("type");
}
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    sendMessage(input);
  }

  return (
    <>
      {!open ? (
  <button
    type="button"
    className={`sl-assistantLauncher ${
  desktopDocked ? "sl-assistantLauncher--docked" : ""
} ${
  premium && resolvedLauncherAppearance === "orb"
    ? "sl-assistantLauncher--orb"
    : ""
}`}
    aria-label="Open assistant"
    aria-expanded={false}
    onClick={() => setOpen(true)}
    style={{ ["--sl-brand" as any]: brandColor }}
  >
{resolvedLauncherAppearance === "bubble" ? (
<span className="sl-assistantBubbleIcon" aria-hidden="true">
<svg viewBox="0 0 24 24" fill="none">
  <path
    d="M6 5.5h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-7l-4.5 3v-3H6a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3Z"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
  <circle cx="8.5" cy="11.5" r="0.9" fill="currentColor" />
  <circle cx="12" cy="11.5" r="0.9" fill="currentColor" />
  <circle cx="15.5" cy="11.5" r="0.9" fill="currentColor" />
</svg>
</span>
) : resolvedLauncherAppearance === "avatar" ? (
  <img
    src={assistantAvatarUrl}
    alt=""
    aria-hidden="true"
    className="sl-assistantLauncherAvatar"
  />
) : (
  <div className="sl-assistantOrbWrap">
    <Orb state={orbState as any} />
  </div>
)}
  </button>
) : null}

{open ? (
  <>
    {!(desktopDocked && !isMobileView) ? (
      <button
        type="button"
        className="sl-assistantBackdrop"
        aria-label="Close assistant"
onClick={() => {
  dismissKeyboard();
  setOpen(false);
}}
      />
    ) : null}

<section
  ref={panelRef}
  className={`sl-assistantPanel ${desktopDocked ? "sl-assistantPanel--docked" : ""} ${premium ? "sl-assistantPanel--premium" : ""}`}
  aria-label={assistantName}
style={{
  ["--sl-brand" as any]: brandColor || "#111827",
  ["--sl-brand-text" as any]: getContrastTextColor(
    brandColor || "#111827"
  ),
}}
>
            <div className="sl-assistantHeader">
  <button
  type="button"
  className="sl-assistantIconBtn"
  aria-label="Conversation history"
  onClick={() => setHistoryOpen((v) => !v)}
>
    <svg
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  aria-hidden="true"
>
  <rect x="4" y="3" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
  <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  <line x1="8" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
</svg>
  </button>

<div className="sl-assistantHeaderCenter">
  <button
    type="button"
    className="sl-assistantTitleOrbBtn"
    onClick={() => setOrbOpen((v) => !v)}
    aria-label={orbOpen ? "Close orb mode" : "Open orb mode"}
  >
    {!orbOpen ? (
      resolvedChatAppearance === "avatar" ? (
        <img
          src={assistantAvatarUrl}
          alt=""
          aria-hidden="true"
          className="sl-assistantTitleAvatarMini"
        />
      ) : (
        <span className="sl-assistantTitleOrbMini">
          <Orb state={orbState as any} />
        </span>
      )
    ) : null}
    <span className="sl-assistantTitleText">{assistantName}</span>
  </button>
</div>

  <button
    type="button"
    className="sl-assistantClose"
    aria-label="Close assistant"
onClick={() => {
  dismissKeyboard();
  setOpen(false);
}}
  >
    ×
  </button>
</div>

{historyOpen ? (
  <>
    <button
      type="button"
      className="sl-assistantHistoryScrim"
      aria-label="Close history"
      onClick={() => setHistoryOpen(false)}
    />
<aside className="sl-assistantHistoryDrawer">
  <div className="sl-assistantHistoryHead">Chat history</div>

  <button
    type="button"
    className="sl-assistantHistoryNew"
    onClick={() => {
  try {
    localStorage.removeItem(getConversationKey(publicKey));
  } catch {}

  setConversationId(null);
  setMessages([
    {
      id: "a-welcome",
      role: "assistant",
      text: welcomeText,
    },
  ]);
  setInput("");
  setLiveTranscript("");
  setAssistantVoiceTranscript("");
  setComposerMode("type");
  setHistoryOpen(false);
}}
  >
    New chat
  </button>

  <button type="button" className="sl-assistantHistoryItem">
    Current conversation
  </button>
</aside>
  </>
) : null}

{orbOpen ? (
  <div className={`sl-orbMode ${hasOrbTranscript ? "has-transcript" : "is-ready"}`}>
    <button
      type="button"
      className="sl-orbModeOrbBtn"
      aria-label="Close orb mode"
      onClick={() => {
  stopRealtimeVoiceSession();
  setOrbOpen(false);
}}
    >
      <div
  className={[
    "sl-orbModeOrb",
    resolvedVoiceAppearance === "avatar"
      ? "sl-orbModeOrb--avatar"
      : "",
  ]
    .filter(Boolean)
    .join(" ")}
>
        {resolvedVoiceAppearance === "avatar" ? (
          <img
            src={assistantAvatarUrl}
            alt=""
            aria-hidden="true"
            className="sl-orbModeAvatar"
          />
        ) : (
          <OrbLarge
  state={orbState as any}
  size="chat"
/>
        )}
      </div>
    </button>

{voiceQuotaNotice ? (
  <div className="sl-orbQuotaNotice">
    {voiceQuotaNotice}
  </div>
) : null}
<div className="sl-orbModeBody">
  {(liveTranscript && liveTranscript.trim()) ? (
    <div className="sl-orbModeTranscriptBlock">
      <div className="sl-orbModeTranscriptLabel">You</div>
      <div className="sl-orbModeTranscript">
        {liveTranscript}
      </div>
    </div>
  ) : null}

  {(assistantVoiceTranscript && assistantVoiceTranscript.trim()) ||
  voiceState === "error" ? (
    <div className="sl-orbModeTranscriptBlock">
      <div className="sl-orbModeTranscriptLabel">
  {assistantName}
</div>
      <div className="sl-orbModeTranscript sl-orbModeTranscript--assistant">
        {assistantVoiceTranscript?.trim() ? (
          assistantVoiceTranscript

        ) : voiceState === "thinking" ? (
          <span className="sl-orbModePlaceholder">Thinking...</span>
        ) : null}
      </div>
    </div>
  ) : null}
</div>

    <div className="sl-orbModeFooter">
      <div className="sl-orbModeControls">
        <button
          type="button"
          className={`sl-orbMiniBtn ${!isSpeakMode ? "is-active" : ""}`}
          aria-label="Switch to typing"
          onClick={() => {
  stopRealtimeVoiceSession();
  setComposerMode("type");
  setOrbOpen(false);
  setTimeout(() => inputRef.current?.focus(), 0);
}}
        >
          <svg
            viewBox="0 0 24 24"
            className="sl-orbMiniIcon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>

<button
  type="button"
  className={`sl-orbMiniBtn ${isSpeakMode ? "is-active" : ""} ${
    realtimeConnRef.current ? "is-listening" : ""
  }`}
  aria-label={realtimeConnRef.current ? "Stop voice input" : "Start voice input"}
  onClick={() => {
    setLastInputMethod("speak");
    setComposerMode("speak");
    toggleRealtimeVoiceSession();
  }}
>
          <svg
            viewBox="0 0 24 24"
            className="sl-orbMiniIcon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 1 0 6 0V4a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <path d="M12 19v4" />
          </svg>
        </button>
      </div>
    </div>
  </div>
) : (
  <>
    <div
  ref={messagesRef}
  className="sl-assistantMessages"
onPointerDown={() => {
  dismissKeyboard();
}}
>

{messages.map((m) => (
  <div
    key={m.id}
    className={`sl-assistantRow ${
      m.role === "user"
        ? "sl-assistantRow--user"
        : "sl-assistantRow--assistant"
    }`}
  >
    {m.role === "staff" ? (
      <div className="sl-assistantSpeakerName">
        👤 {m.speakerName || "Store team"}
      </div>
    ) : null}

    {m.text ? (
      <div
        className={`sl-assistantMsg ${
          m.role === "user"
            ? "sl-assistantMsg--user"
            : m.role === "staff"
              ? "sl-assistantMsg--staff"
              : "sl-assistantMsg--assistant"
        }`}
      >
        {m.text}
      </div>
    ) : null}

    {m.products?.length ? (
      <div className="sl-assistantProducts">
        {m.products.map((p: any, idx: number) => {
          const imageSrc = p.dataUrl || p.image;

          if (p.type === "image" && imageSrc) {
            return (
              <div key={p.name || idx} className="sl-assistantProductCard">
                <img
                  src={imageSrc}
                  alt={p.name || "Image attachment"}
                  className="sl-assistantProductImage"
                />

                <div className="sl-assistantProductMeta">
                  <div className="sl-assistantProductTitle">
                    {p.name || "Image attachment"}
                  </div>
                  <div className="sl-assistantProductStatus">
                    Image attachment
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={p.id || idx} className="sl-assistantProductCard">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.title || "Product"}
                  className="sl-assistantProductImage"
                />
              ) : (
                <div className="sl-assistantProductImage sl-assistantProductImage--placeholder" />
              )}

              <div className="sl-assistantProductMeta">
                <div className="sl-assistantProductTitle">
                  {p.title || "Product"}
                </div>

                {typeof p.price === "number" ? (
                  <div className="sl-assistantProductPrice">
                    ${p.price.toFixed(2)}
                  </div>
                ) : null}

                <div className="sl-assistantProductStatus">
                  {p.available ? "In stock" : "Unavailable"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ) : null}
  </div>
))}

      {sending &&
      messages[messages.length - 1]?.role === "assistant" &&
      messages[messages.length - 1]?.text === "" ? (
        <div className="sl-assistantRow sl-assistantRow--assistant">
          <div className="sl-assistantMsg sl-assistantMsg--assistant">
            <div className="sl-assistantThinking">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      ) : null}

      <div ref={endRef} />
    </div>

    <div className="sl-assistantComposer">
      {open ? (
        <button
          type="button"
          className={`sl-assistantModeIcon ${holdingToTalk ? "is-holding" : ""}`}
          aria-label={isSpeakMode ? "Switch to typing" : "Switch to speaking"}
          onClick={() => {
            if (isSpeakMode) {
              setComposerMode("type");
              setHoldingToTalk(false);
              setTimeout(() => inputRef.current?.focus(), 0);
            } else {
              setLastInputMethod("speak");
              setComposerMode("speak");
              inputRef.current?.blur();
            }
          }}
        >
          {isSpeakMode ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 20h9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <img
              src="/talk-waves.svg"
              alt=""
              aria-hidden="true"
              className="sl-assistantModeImg"
            />
          )}
        </button>
      ) : null}

      {isSpeakMode ? (
<button
  type="button"
  className={`sl-assistantHoldField ${holdingToTalk ? "is-listening" : ""}`}
  onClick={toggleTextSpeechCapture}
>
          {holdingToTalk ? (
            <span className="sl-assistantHoldLive">
              <span className="sl-assistantHoldDots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              Listening...
            </span>
          ) : (
            "Tap to speak"
          )}
        </button>
      ) : (
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setLastInputMethod("type");
            setInput(e.target.value);
          }}
onFocus={() => {
  if (!keepSpeakModeRef.current) {
    setLastInputMethod("type");
    setComposerMode("type");
  }

  window.setTimeout(() => {
    scrollToBottom("auto");
  }, 250);
}}
onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!input.trim() || sending) return;
              sendMessage(input);
            }
          }}
          className="sl-assistantInput"
          placeholder="Ask about products..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      )}

      <button
        type="button"
        className="sl-assistantSendIcon"
        disabled={!hasText || sending || isSpeakMode}
        aria-label="Send message"
        onClick={() => {
          if (!hasText || sending || isSpeakMode) return;
          sendMessage(input);
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 19V6"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M6.5 11.5L12 6l5.5 5.5"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  </>
)}
          </section>
        </>
      ) : null}

      <style jsx>{`
.sl-assistantLauncher{
  width:56px;
  height:56px;
  min-width:56px;
  min-height:56px;
  padding:0;
  box-sizing:border-box;

  display:flex;
  align-items:center;
  justify-content:center;

  border-radius:50%;
  background:#ffffff;
  border:1px solid #d1d5db;

  color:#6b7280;
  line-height:0;

  box-shadow:0 8px 24px rgba(15,23,42,.14);

  appearance:none;
  -webkit-appearance:none;

  transition:
    transform .18s ease,
    box-shadow .18s ease;
}

.sl-assistantLauncher--docked{
  position:absolute;
  right:0;
  bottom:0;
}

.sl-assistantLauncher:hover{
  transform:translateY(-1px);
  box-shadow:0 12px 30px rgba(15,23,42,.18);
}

.sl-assistantLauncher:active{
  transform:scale(.96);
}

.sl-assistantLauncher--orb{
  width:56px;
  height:56px;

  background:transparent;
  border:none;
  box-shadow:none;
}

.sl-assistantOrbWrap{
  width:44px;
  height:44px;
  display:flex;
  align-items:center;
  justify-content:center;
}

.sl-assistantBubbleIcon{
  width:22px;
  height:22px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  color:#6b7280;
}

.sl-assistantBubbleIcon svg{
  width:22px;
  height:22px;
  display:block;
  transform:translateY(2px);
}

        .sl-assistantLauncherAvatar{
          width:44px;
          height:44px;
          border-radius:999px;
          object-fit:cover;
          display:block;
          border:2px solid rgba(255,255,255,.95);
          box-shadow:0 12px 28px rgba(15,23,42,.22);
          background:#ffffff;
        }

        .sl-assistantTitleAvatarMini{
          width:24px;
          height:24px;
          border-radius:999px;
          object-fit:cover;
          display:block;
          flex:0 0 24px;
          border:1px solid rgba(255,255,255,.7);
          background:#ffffff;
        }

.sl-orbModeAvatar {
  width: 100%;
  height: 100%;
  max-width: none;
  aspect-ratio: 1 / 1;
  flex: 0 0 auto;

  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  display: block;

  border: 1px solid #e5e7eb;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
  background: #ffffff;
}

.sl-orbModeOrb {
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.sl-orbModeOrb--avatar {
  width: min(190px, 54vw);
  height: min(190px, 54vw);
  aspect-ratio: 1 / 1;
  flex: 0 0 auto;
}

        .sl-assistantBackdrop{
          position:fixed;
          inset:0;
          background:rgba(15,23,42,.18);
          border:0;
          padding:0;
          z-index:998;
        }

        .sl-assistantPanel{
          position:fixed;
          right:12px;
          left:12px;
          top:88px;
          bottom:12px;
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:24px;
          overflow:hidden;
          z-index:999;
          display:flex;
          flex-direction:column;
          box-shadow:0 20px 50px rgba(15,23,42,.16);
        }


        .sl-assistantHeader{
  display:grid;
  grid-template-columns:40px 1fr 40px;
  align-items:center;
  gap:10px;
  padding:14px;
  border-bottom:1px solid #e5e7eb;
  background:var(--sl-brand, #111827);
  color: var(--sl-brand-text, #fff);
  flex:0 0 auto;
}

.sl-assistantHeaderCenter{
  text-align:center;
  min-width:0;
}

.sl-assistantIconBtn{
  width:50px;
  height:50px;
  border:none;
  background:transparent;
  color:var(--sl-brand-text, #fff);
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
}

        .sl-assistantHeaderLeft{
          display:flex;
          align-items:center;
          gap:10px;
          min-width:0;
        }

        .sl-assistantHeaderOrb{
          width:34px;
          height:34px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex:0 0 34px;
        }

        .sl-assistantTitle{
          font-size:14px;
          font-weight:800;
          color:#111827;
        }

        .sl-assistantSub{
          margin-top:2px;
          font-size:12px;
          color:#6b7280;
        }

        .sl-assistantClose{
  width:40px;
  height:40px;
  border:none;
  background:transparent;
  color:var(--sl-brand-text, #fff);
  font-size:28px;
  line-height:1;
  cursor:pointer;
  flex:0 0 36px;
  padding:0;
}

.sl-assistantMessages{
  flex:1 1 auto;
  min-height:0;
  overflow-y:auto;
  overflow-x:hidden;
  padding:34px 14px 16px;
  background:#f8fafc;
  scroll-padding-top:34px;
}

        .sl-assistantRow{
          display:grid;
          gap:10px;
          margin:10px 0;
        }

        .sl-assistantRow--user{
          justify-items:end;
        }

.sl-assistantMsg{
  max-width:85%;
  border-radius:18px;
  padding:14px 18px;
  font-size:16px;
  line-height:1.45;
  font-weight:400;
  white-space:pre-wrap;
  border:1px solid #e5e7eb;
}

.sl-assistantMsg--user{
  background:var(--sl-brand, #111827);
  color:var(--sl-brand-text, #fff);
  border-color:var(--sl-brand, #111827);
}

        .sl-assistantMsg--assistant{
          background:#fff;
          color:#111827;
        }

        .sl-assistantMsg.sl-assistantMsg--staff{
  background:#475569 !important;
  color:#ffffff !important;
  border-color:#475569 !important;
}

.sl-assistantMsg--staff{
  background:#475569;
  color:#ffffff;
  border-color:#475569;
}

        .sl-assistantThinking{
          display:flex;
          gap:6px;
          align-items:center;
        }

        .sl-assistantThinking span{
          width:6px;
          height:6px;
          border-radius:999px;
          background:#9ca3af;
          display:block;
          animation:sl-think 1s infinite ease-in-out;
        }

        .sl-assistantThinking span:nth-child(2){
          animation-delay:.15s;
        }

        .sl-assistantThinking span:nth-child(3){
          animation-delay:.3s;
        }

        .sl-assistantProducts{
          width:100%;
          display:grid;
          gap:10px;
        }

        .sl-assistantProductCard{
          display:grid;
          grid-template-columns:72px 1fr;
          gap:10px;
          text-decoration:none;
          color:inherit;
          border:1px solid #e5e7eb;
          border-radius:16px;
          background:#fff;
          padding:10px;
        }

        .sl-assistantProductImage{
          width:72px;
          height:72px;
          object-fit:cover;
          border-radius:12px;
          background:#f3f4f6;
          display:block;
        }

        .sl-assistantProductImage--placeholder{
          background:#e5e7eb;
        }

        .sl-assistantProductMeta{
          display:grid;
          gap:4px;
          align-content:start;
        }

        .sl-assistantProductTitle{
          font-size:14px;
          font-weight:800;
          line-height:1.35;
          color:#111827;
        }

        .sl-assistantProductPrice{
          font-size:13px;
          font-weight:800;
          color:#111827;
        }

        .sl-assistantProductStatus{
          font-size:12px;
          color:#6b7280;
        }

.sl-assistantHoldField{
  flex:1;
  min-width:0;
  height:44px;
  border:1px solid #d1d5db;
  border-radius:14px;
  padding:0 14px;
  background:#fff;
  color:#9ca3af;
  text-align:left;
  display:flex;
  align-items:center;
  cursor:pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease,
    color 160ms ease;
}

.sl-assistantHoldField.is-listening{
  border-color:#007AFF;
  background:#f2f8ff;
  color:#007AFF;
  box-shadow:0 0 0 3px rgba(0,122,255,.10);
  transform:scale(1.01);
}

.sl-assistantHoldLive{
  display:inline-flex;
  align-items:center;
  gap:8px;
}

.sl-assistantHoldDots{
  display:inline-flex;
  align-items:center;
  gap:4px;
}

.sl-assistantHoldDots span{
  width:5px;
  height:5px;
  border-radius:999px;
  background:currentColor;
  display:block;
  animation:sl-hold-dot 1s infinite ease-in-out;
}

.sl-assistantHoldDots span:nth-child(2){
  animation-delay:.15s;
}

.sl-assistantHoldDots span:nth-child(3){
  animation-delay:.3s;
}

.sl-assistantComposer{
  flex:0 0 auto;
  display:flex;
  align-items:center;
  gap:8px;
  padding:10px;
  padding-bottom:calc(10px + env(safe-area-inset-bottom));
  border-top:1px solid #e5e7eb;
  background:#fff;
}

.sl-assistantSpeakerName{
  font-size:11px;
  font-weight:700;
  color:#6b7280;
  margin-left:4px;
  margin-bottom:-4px;
}

.sl-assistantInput{
  flex:1;
  min-width:0;
  min-height:44px;
  max-height:108px;
  border:1px solid #d1d5db;
  border-radius:14px;
  padding:11px 14px;
  background:#fff;
  font-size:16px;
  line-height:1.4;
  resize:none;
  overflow-y:auto;
}

.sl-assistantInput:focus{
  outline:none;
  border-color:#cbd5e1;
  box-shadow:none;
}

.sl-assistantSendIcon{
  width:42px !important;
  height:42px !important;
  min-width:42px !important;
  min-height:42px !important;
  max-width:42px !important;
  max-height:42px !important;
  flex:0 0 38px !important;

  border-radius:999px;
border:1px solid var(--sl-brand, #111827);
background:var(--sl-brand, #111827);
color:var(--sl-brand-text, #fff);

  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
  cursor:pointer;
}

.sl-assistantSendIcon[disabled]{
  opacity:.6;
  cursor:not-allowed;
}

.sl-assistantTalkIcon{
  width:42px;
  height:42px;
  min-width:42px;
  min-height:42px;
  max-width:42px;
  max-height:42px;
  flex:0 0 42px;

  border-radius:999px;
  border:1px solid #d1d5db;
  background:#fff;
  color:#6b7280;

  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
  cursor:pointer;
}

.sl-assistantTalkIcon svg{
  width:22px;
  height:22px;
  display:block;
}

.sl-assistantIconBtn svg,
.sl-assistantSendIcon svg{
  width:28px;
  height:28px;
  display:block;
}

.sl-assistantModeIcon{
  width:42px;
  height:42px;
  min-width:42px;
  min-height:42px;
  max-width:42px;
  max-height:42px;
  flex:0 0 42px;

  border:none;
  background:transparent;
  color:#6b7280;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
  cursor:pointer;
}

.sl-assistantModeIcon svg{
  width:24px;
  height:24px;
  display:block;
}

.sl-assistantModeImg{
  width:22px;
  height:22px;
  display:block;
  object-fit:contain;
  opacity:.98;
}

.sl-assistantHistoryScrim{
  position:absolute;
  inset:0;
  background:transparent;
  border:0;
  padding:0;
  z-index:25;
}

.sl-assistantHistoryDrawer{
  position:absolute;
  top:0;
  left:0;
  bottom:0;
  width:min(60vw, 280px);
  border:1px solid #9ca3af;
  border-radius:0;
  background:#fff;
  z-index:30;
  padding:28px 22px;
  display:flex;
  flex-direction:column;
  gap:24px;
  align-items:stretch;
}

  .sl-assistantHistoryHead{
    font-size:17px;
    text-align:left;
  }

  .sl-assistantHistoryNew{
    font-size:17px;
    text-align:left;
  }

  .sl-assistantHistorySectionSub{
    font-size:15px;
    text-align:left;
  }

  .sl-assistantHistoryItem{
    font-size:16px;
    text-align:left;
  }

  .sl-assistantHistoryScrim{
    background:rgba(15,23,42,.35);
  }
}

.sl-assistantHistoryHead{
  font-size:11px;
  font-weight:700;
  color:#111827;
  line-height:1.3;
}

.sl-assistantHistoryNew{
  border:none;
  background:transparent;
  padding:0;
  text-align:left;
  font-size:11px;
  font-weight:700;
  color:#111827;
  cursor:pointer;
}

.sl-assistantHistorySection{
  font-size:11px;
  color:#111827;
  line-height:1.2;
}

.sl-assistantHistorySectionSub{
  font-size:10px;
  color:#6b7280;
  line-height:1.2;
}

.sl-assistantHistoryItem{
  border:none;
  background:transparent;
  padding:0;
  text-align:left;
  font-size:11px;
  color:#6b7280;
  line-height:1.25;
  cursor:pointer;
}

.sl-assistantHistoryNew,
.sl-assistantHistoryItem{
  width:100%;
  text-align:left;
}

.sl-assistantHistoryNew,
.sl-assistantHistoryItem{
  display:block;
  width:100%;
  text-align:left !important;
  justify-content:flex-start !important;
}

.sl-assistantHistoryHead,
.sl-assistantHistorySection,
.sl-assistantHistorySectionSub,
.sl-assistantHistoryFooter{
  width:100%;
  text-align:left;
}

.sl-assistantHistoryHead{
  font-size:18px !important;
}

.sl-assistantHistoryNew{
  font-size:18px !important;
  font-weight:800 !important;
}

.sl-assistantHistorySectionSub{
  font-size:16px !important;
}

.sl-assistantHistoryItem{
  font-size:17px !important;
  font-weight:700 !important;
}

.sl-assistantHistoryFooter{
  margin-top:auto;
  font-size:10px;
  color:#6b7280;
}

.sl-assistantTitleOrbBtn{
  border:none;
  background:transparent;
  padding:0;
  margin:0;
  font:inherit;
  color:var(--sl-brand-text, #fff);
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  min-width:0;
}

.sl-assistantTitleOrbMini{
  width:22px;
  height:22px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  flex:0 0 22px;
}

.sl-assistantTitleText{
  font-size:13px;
  font-weight:800;
  line-height:1.2;
  white-space:nowrap;
}

.sl-assistantRow--user .sl-assistantSpeakerName{
  text-align:right;
  margin-right:4px;
  margin-left:0;
}

.sl-assistantSpeakerName{
  font-size:11px;
  font-weight:700;
  color:#6b7280;
  margin-left:4px;
  margin-bottom:-4px;
}

.sl-orbMode{
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:center;
  background:#fff;
  padding:18px 20px 14px;
}

.sl-orbModeOrbBtn {
  display: block;
  border: none;
  background: transparent;
  padding: 5px;
  margin-top: 2px;
  margin-bottom: 16px;
  overflow: visible;
  cursor: pointer;
}

.sl-orbModeOrb {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.sl-orbModeBody{
  width:100%;
  max-width:320px;
  flex:1;
  display:flex;
  flex-direction:column;
  justify-content:center;
  gap:16px;
  padding:18px 0 12px;
}

.sl-orbModeTranscriptBlock{
  display:grid;
  gap:6px;
}

.sl-orbModeTranscriptLabel{
  font-size:11px;
  font-weight:700;
  color:#6b7280;
  padding:0 2px;
}

.sl-orbModeTranscript{
  width:100%;
  border:0;
  border-radius:10px;
  background:#efefef;
  color:#111827;
  padding:14px 14px;
  font-size:14px;
  line-height:1.45;
  white-space:pre-wrap;
  word-break:break-word;
}

.sl-orbModeTranscript--assistant{
}

.sl-orbModePlaceholder{
  color:#6b7280;
}

.sl-orbModeFooter{
  width:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:12px;
  padding-bottom:calc(4px + env(safe-area-inset-bottom));
}

.sl-orbModeText{
  text-align:center;
  font-size:13px;
  line-height:1.4;
  color:#111827;
  font-weight:600;
}

.sl-orbModeControls{
  display:flex;
  align-items:center;
  gap:18px;
}

.sl-orbMode.is-ready{
  justify-content:center;
}

.sl-orbMode.is-ready .sl-orbModeBody{
  flex:0 0 auto;
  padding:14px 0 10px;
}

.sl-orbMode.is-ready .sl-orbModeFooter{
  margin-top:6px;
}

.sl-orbMode.has-transcript{
  justify-content:flex-start;
}

.sl-orbMiniBtn{
  width:28px;
  height:28px;
  border:none;
  background:transparent;
  color:#111827;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  padding:0;
  opacity:.7;
  transition:opacity 160ms ease, transform 160ms ease;
}

.sl-orbMiniBtn.is-active{
  opacity:1;
}

.sl-orbMiniBtn.is-listening{
  opacity:1;
  transform:scale(1.08);
}

.sl-orbMiniIcon{
  width:16px;
  height:16px;
  display:block;
}

@media (min-width: 900px){
  .sl-orbMode{
    padding:24px 24px 18px;
  }

.sl-orbModeOrb{
  width:150px;
  height:150px;
}

  .sl-orbModeOrb--avatar {
  width: 190px;
  height: 190px;
}

  .sl-orbModeBody{
    max-width:100%;
    gap:18px;
  }

  .sl-orbModeTranscript{
    border-radius:14px;
  }

  .sl-orbMiniBtn{
    width:40px;
    height:40px;
  }

  .sl-orbMiniIcon{
    width:18px;
    height:18px;
  }
}

.sl-orbQuotaNotice{
  margin-top:10px;
  margin-bottom:6px;
  text-align:center;
  font-size:12px;
  line-height:1.35;
  color:#6b7280;
  max-width:260px;
  animation:slFadeIn .18s ease;
}

@keyframes slFadeIn{
  from{opacity:0; transform:translateY(4px);}
  to{opacity:1; transform:translateY(0);}
}

@keyframes sl-hold-dot{
  0%, 80%, 100%{
    transform:scale(1);
    opacity:.45;
  }
  40%{
    transform:scale(1.35);
    opacity:1;
  }
}

        @keyframes sl-think{
          0%, 80%, 100%{ transform:scale(1); opacity:.55; }
          40%{ transform:scale(1.25); opacity:1; }
        }

/* Unified history drawer: desktop + mobile */
.sl-assistantHistoryDrawer{
  top:0;
  left:0;
  bottom:0;
  width:min(52vw, 260px);
  border-radius:0;
  border-top:none;
  border-left:none;
  border-bottom:none;
  padding:28px 22px;
  gap:24px;
  align-items:stretch;
}

.sl-assistantHistoryHead{
  font-size:18px !important;
  text-align:left !important;
}

.sl-assistantHistoryNew{
  font-size:18px !important;
  font-weight:800 !important;
  text-align:left !important;
}

.sl-assistantHistorySectionSub{
  font-size:16px !important;
  text-align:left !important;
}

.sl-assistantHistoryItem{
  font-size:17px !important;
  font-weight:700 !important;
  text-align:left !important;
}

@media (min-width: 760px){
  .sl-assistantPanel.sl-assistantPanel--docked{
    position:relative !important;
    inset:auto !important;
    width:100% !important;
    height:100% !important;
    min-height:0 !important;
    max-height:none !important;
    border-radius:24px !important;
  }
}

@media (max-width: 899px){
  .sl-assistantPanel{
    position:fixed !important;

    top:var(--sl-visible-top, 0px) !important;
    left:0 !important;
    right:0 !important;
    bottom:auto !important;

    width:100% !important;
    max-width:none !important;

    height:var(--sl-visible-height, 100dvh) !important;
    min-height:0 !important;
    max-height:none !important;

    border-radius:0 !important;
    overflow:hidden !important;

    display:flex !important;
    flex-direction:column !important;

    overscroll-behavior:none;
  }

  .sl-assistantHeader{
    flex:0 0 auto !important;
    position:relative;
    z-index:30;
  }

  .sl-assistantMessages{
    flex:1 1 auto !important;
    min-height:0 !important;
    overflow-y:auto !important;
    overflow-x:hidden !important;
    overscroll-behavior:contain;
    -webkit-overflow-scrolling:touch;
    touch-action:pan-y;
  }

  .sl-assistantComposer{
    flex:0 0 auto !important;
    position:relative !important;
    bottom:auto !important;
    z-index:30;
  }
}

.sl-orbModeOrb--avatar {
  width: min(190px, 54vw);
  height: min(190px, 54vw);
  aspect-ratio: 1 / 1;
  flex: 0 0 auto;
}

@media (max-width: 899px) {
  .sl-orbModeOrb--avatar {
    width: min(220px, 58vw);
    height: min(220px, 58vw);
  }
}
      `}</style>
    </>
  );
  }