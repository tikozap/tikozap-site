// src/components/HeroDemoModal.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Orb } from "@/components/Orb";
import { OrbLarge } from "@/components/OrbLarge";
import { requestMicPermission } from "@/lib/audio-permission";
import type { VoiceSessionState } from "@/lib/voice-state";
import { connectRealtime } from "@/lib/realtime-webrtc";

type EntryMode = "chat" | "voice";
type DemoMode = "chat" | "voice";

type ChatProduct = {
  id: string;
  title: string;
  price?: number;
  image?: string;
  available?: boolean;
  url?: string;
};

type DemoMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  products?: ChatProduct[];
};

type Props = {
  open: boolean;
  mode: EntryMode;
  onClose: () => void;
};

const CHAT_WELCOME =
  "Hi, I’m Tiko. Ask me about products, orders, shipping, or store info.";

const VOICE_IDLE_TIMEOUT_MS = 45000;
const THINK_PAUSE_MS = 900;
const PACE_INTERVAL_MS = 34;
const PACE_CHARS_PER_TICK = 2;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function HeroDemoModal({ open, mode, onClose }: Props) {
  const [currentMode, setCurrentMode] = useState<DemoMode>("voice");
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [voiceState, setVoiceState] = useState<VoiceSessionState>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [voiceSessionInfo, setVoiceSessionInfo] = useState<{
    ready: boolean;
    model: string | null;
    expiresAt: number | null;
  } | null>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [userType, setUserType] = useState<"anonymous" | "signed-in" | null>(
    null
  );

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const pendingTextRef = useRef<string>("");

  const realtimeConnRef = useRef<{
    pc: RTCPeerConnection;
    dc: RTCDataChannel;
    audioEl: HTMLAudioElement;
    interrupt: () => void;
    speak?: (text: string) => void;
  } | null>(null);

  const voiceStateRef = useRef<VoiceSessionState>("idle");
  const userTranscriptBufferRef = useRef("");
  const assistantTranscriptBufferRef = useRef("");
  const silenceTimerRef = useRef<number | null>(null);

  const shouldStickToBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);

  function scrollMessagesToBottom(behavior: ScrollBehavior = "smooth") {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }

  function isNearBottom() {
    const el = messagesRef.current;
    if (!el) return true;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceFromBottom < 48;
  }

  function handleMessagesScroll() {
    shouldStickToBottomRef.current = isNearBottom();
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

  function focusComposer() {
    inputRef.current?.focus();
  }

  function clearSilenceTimer() {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  function armSilenceTimer() {
    clearSilenceTimer();

silenceTimerRef.current = window.setTimeout(() => {
  if (currentMode === "voice" && realtimeConnRef.current) {
    setVoiceState("idle");
    setAssistantTranscript("Tap the mic when you want to talk again.");
  }
}, VOICE_IDLE_TIMEOUT_MS);
  }

  function resetVoiceTranscriptBuffers() {
    userTranscriptBufferRef.current = "";
    assistantTranscriptBufferRef.current = "";
    setUserTranscript("");
    setAssistantTranscript("");
  }

  function stopVoiceSession() {
    clearSilenceTimer();

    setVoiceState("idle");
    resetVoiceTranscriptBuffers();
    setVoiceSessionInfo(null);

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

async function handleVoiceClick() {
  setCurrentMode("voice");
  setError(null);

  // Prevent double-start while already connecting or connected
  if (
    realtimeConnRef.current ||
    voiceState === "permission" ||
    voiceState === "thinking" ||
    voiceState === "listening" ||
    voiceState === "speaking"
  ) {
    return;
  }

  setVoiceState("permission");
  resetVoiceTranscriptBuffers();
  setAssistantTranscript("Checking microphone permission...");

  const permission = await requestMicPermission();

  if (!permission.ok) {
    setVoiceState("error");
    setAssistantTranscript("Microphone access was denied or unsupported.");
    return;
  }

  setVoiceState("thinking");
  setAssistantTranscript("Microphone ready. Creating secure voice session...");

  try {
    const res = await fetch("/api/realtime/session", {
      method: "POST",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      setVoiceState("error");
      setAssistantTranscript(
        data?.error || "Failed to create realtime voice session."
      );
      return;
    }

    if (!data?.client_secret?.value) {
      setVoiceState("error");
      setAssistantTranscript("Missing realtime client secret.");
      return;
    }

    setAssistantTranscript("Connecting realtime audio...");

    const conn = await connectRealtime(data.client_secret.value, {
      onUserTranscript: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        userTranscriptBufferRef.current = trimmed;
        setUserTranscript(trimmed);
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

        setAssistantTranscript(assistantTranscriptBufferRef.current);
      },

onUserSpeechStart: () => {
  clearSilenceTimer();
  setVoiceState("listening");
},

      onUserSpeechStop: () => {
        setVoiceState("thinking");
      },

      onAssistantSpeechStart: () => {
        assistantTranscriptBufferRef.current = "";
        setAssistantTranscript("");
        setVoiceState("speaking");
        clearSilenceTimer();
      },

      onAssistantSpeechStop: () => {
        setVoiceState("listening");
        armSilenceTimer();
      },

      onInterrupted: () => {
        assistantTranscriptBufferRef.current = "";
        setAssistantTranscript("");
        setVoiceState("listening");
      },

      onError: (message) => {
        setVoiceState("error");
        setAssistantTranscript(message);
      },
    });

    realtimeConnRef.current = conn;

    setVoiceSessionInfo({
      ready: true,
      model: data?.model ?? null,
      expiresAt:
        typeof data?.expires_at === "number" ? data.expires_at : null,
    });

    setVoiceState("listening");
    setUserTranscript("");
    setAssistantTranscript("");
    armSilenceTimer();
  } catch (e: any) {
    setVoiceState("error");
    setAssistantTranscript(e?.message || "Voice session setup failed.");
  }
}

  function switchToChat() {
    stopVoiceSession();
    setCurrentMode("chat");
    setError(null);

    setMessages((prev) =>
      prev.length > 0
        ? prev
        : [
            {
              id: "a-welcome",
              role: "assistant",
              text: CHAT_WELCOME,
            },
          ]
    );

    setTimeout(() => {
      focusComposer();
    }, 0);
  }

function switchToVoice() {
  stopVoiceSession();
  setCurrentMode("voice");
  setError(null);
  resetVoiceTranscriptBuffers();
  setVoiceState("idle");
  setAssistantTranscript("");
}

  async function sendRealMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setError(null);
    setSending(true);
    setInput("");
    shouldStickToBottomRef.current = true;

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

    const startedAt = Date.now();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const serverMessage =
          data.detail || data.error || `HTTP ${res.status} ${res.statusText}`;

        setError(serverMessage);
        setRemaining(
          typeof data.remaining === "number" ? data.remaining : null
        );
        setDailyLimit(
          typeof data.dailyLimit === "number" ? data.dailyLimit : null
        );
        setUserType(
          data.userType === "anonymous" || data.userType === "signed-in"
            ? data.userType
            : null
        );

        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            id: copy[copy.length - 1]?.id ?? `a-err-${Date.now()}`,
            role: "assistant",
            text: `Server error: ${serverMessage}`,
          };
          return copy;
        });

        setSending(false);
        abortRef.current = null;
        return;
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
          const line = chunk.split("\n").find((l: any) => l.startsWith("data: "));
          if (!line) continue;

          const payload = JSON.parse(line.slice(6));

          if (payload.type === "meta") {
            if (payload.conversationId) {
              setConversationId(payload.conversationId);
            }
            if (typeof payload.remaining === "number") {
              setRemaining(payload.remaining);
            }
            if (typeof payload.dailyLimit === "number") {
              setDailyLimit(payload.dailyLimit);
            }
            if (
              payload.userType === "anonymous" ||
              payload.userType === "signed-in"
            ) {
              setUserType(payload.userType);
            }
          }

          if (payload.type === "delta" && payload.delta) {
            pendingTextRef.current += payload.delta;
          }

          if (payload.type === "final") {
            if (typeof payload.remaining === "number") {
              setRemaining(payload.remaining);
            }

            if (typeof payload.dailyLimit === "number") {
              setDailyLimit(payload.dailyLimit);
            }

            if (
              payload.userType === "anonymous" ||
              payload.userType === "signed-in"
            ) {
              setUserType(payload.userType);
            }

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

            setSending(false);
            abortRef.current = null;
          }
        }
      }

      while (pendingTextRef.current.length > 0) {
        await sleep(PACE_INTERVAL_MS);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setError("Network error");
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            id: copy[copy.length - 1]?.id ?? `a-net-${Date.now()}`,
            role: "assistant",
            text: "Network issue—try again in a moment.",
          };
          return copy;
        });
      }
    } finally {
      abortRef.current = null;
      stopRevealPump();
      pendingTextRef.current = "";
      setSending(false);

      setTimeout(() => {
        focusComposer();
      }, 0);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    sendRealMessage(input);
  }

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setInput("");
    setConversationId(null);
    setRemaining(null);
    setDailyLimit(null);
    setUserType(null);
    stopRevealPump();
    pendingTextRef.current = "";
    abortRef.current?.abort();
    abortRef.current = null;
    shouldStickToBottomRef.current = true;
    prevMessageCountRef.current = 0;

if (mode === "voice") {
  stopVoiceSession();
  setCurrentMode("voice");
  setMessages([]);
  resetVoiceTranscriptBuffers();
  setVoiceState("idle");
  setAssistantTranscript("");
} else {
      stopVoiceSession();
      setCurrentMode("chat");
      setMessages([
        {
          id: "a-welcome",
          role: "assistant",
          text: CHAT_WELCOME,
        },
      ]);
      setTimeout(() => {
        focusComposer();
      }, 0);
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyTouchAction = body.style.touchAction;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.touchAction = prevBodyTouchAction;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || currentMode !== "chat") return;

    const messageCountChanged = messages.length !== prevMessageCountRef.current;
    const behavior: ScrollBehavior =
      messages.length <= 1 ? "auto" : "smooth";

    if (messageCountChanged) {
      shouldStickToBottomRef.current = true;
      scrollMessagesToBottom(behavior);
      prevMessageCountRef.current = messages.length;
      return;
    }

    if (sending && shouldStickToBottomRef.current) {
      scrollMessagesToBottom("auto");
    }
  }, [messages, open, currentMode, sending]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      stopRevealPump();
      stopVoiceSession();
    };
  }, []);

  const orbState =
    error || remaining === 0
      ? "sad"
      : currentMode === "voice"
      ? voiceState === "listening"
        ? "listening"
        : voiceState === "thinking"
        ? "thinking"
        : voiceState === "speaking"
        ? "speaking"
        : "idle"
      : !sending
      ? "idle"
      : messages[messages.length - 1]?.role === "assistant" &&
        (messages[messages.length - 1]?.text ?? "") === ""
      ? "thinking"
      : "speaking";

  const modalClassName = useMemo(
    () => `hero-modal hero-modal--${currentMode}`,
    [currentMode]
  );

  if (!open) return null;

  return (
    <div className="hero-modal-backdrop" onClick={onClose}>
      <div
        className={modalClassName}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="TikoZap demo"
      >
        <div className="hero-demo-header">
          <div className="hero-demo-headerLeft">
            <span className="hero-demo-brand">Tiko</span>
            <span className="hero-demo-previewPill">Preview mode</span>
          </div>

          <div className="hero-demo-headerRight">
            {currentMode === "chat" ? (
              <div className="hero-demo-headerOrb">
                <Orb
                  state={orbState}
                  tiltX={0}
                  tiltY={0}
                  expression={error || remaining === 0 ? "concern" : "neutral"}
                />
              </div>
            ) : null}

            <button
              className="hero-modal-close"
              type="button"
              aria-label="Close demo"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        {currentMode === "chat" ? (
          <div className="hero-demo-chatLayout">
            <div
              ref={messagesRef}
              className="hero-demo-messages chat-messages-scroll"
              onScroll={handleMessagesScroll}
            >
              <div className="hero-demo-messagesInner">
                {messages.map((m, idx: any) => {
                  const isLast = idx === messages.length - 1;
                  const showCursor =
                    sending && isLast && m.role === "assistant";

                  return (
                    <div
                      key={m.id}
                      className={`hero-demo-row ${
                        m.role === "user"
                          ? "hero-demo-row-user"
                          : "hero-demo-row-assistant"
                      }`}
                    >
                      <div
                        className={`hero-demo-msg ${
                          m.role === "user"
                            ? "hero-demo-msg-user"
                            : "hero-demo-msg-assistant"
                        }`}
                      >
                        {m.text ? <span>{m.text}</span> : null}

                        {showCursor && (
                          <span className="inline-block align-baseline ml-1 animate-pulse">
                            ▍
                          </span>
                        )}
                      </div>

 {m.role === "assistant" && m.products?.length ? (
  <div className="hero-demo-productsWrap">
    {m.products.map((p: any) => {
      const cardContent = (
        <>
          {p.image ? (
            <img
              src={p.image}
              alt={p.title}
              className="hero-demo-productImage"
            />
          ) : (
            <div className="hero-demo-productImage hero-demo-productImage--placeholder" />
          )}

          <div className="hero-demo-productMeta">
            <div className="hero-demo-productTitle">{p.title}</div>

            {typeof p.price === "number" ? (
              <div className="hero-demo-productPrice">
                ${p.price.toFixed(2)}
              </div>
            ) : null}

            <div className="hero-demo-productSubtitle">
              {p.available ? "In stock" : "Unavailable"}
            </div>
          </div>
        </>
      );

      return p.url && p.url !== "#" ? (
        <a
          key={p.id}
          href={p.url}
          target="_blank"
          rel="noreferrer"
          className="hero-demo-productCard"
        >
          {cardContent}
        </a>
      ) : (
        <div key={p.id} className="hero-demo-productCard">
          {cardContent}
        </div>
      );
    })}
  </div>
) : null}
                    </div>
                  );
                })}

                {sending &&
                  messages[messages.length - 1]?.role === "assistant" &&
                  messages[messages.length - 1]?.text === "" && (
                    <div className="hero-demo-row hero-demo-row-assistant">
                      <div className="hero-demo-msg hero-demo-msg-assistant hero-demo-thinkingBubble">
                        <div className="hero-demo-thinking">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    </div>
                  )}

                <div ref={endRef} />
              </div>
            </div>

            <form className="hero-demo-inputRow" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products, orders, or store info…"
                className="hero-demo-input"
                autoComplete="off"
                disabled={remaining === 0}
              />
              <button
                type="submit"
                className="button"
                disabled={!input.trim() || sending || remaining === 0}
              >
                {sending ? "..." : "Send"}
              </button>
            </form>

            <div className="hero-demo-controls hero-demo-controls--chat">
              <button
                className="orb-btn is-active"
                aria-label="Switch to chat demo"
                type="button"
                onClick={switchToChat}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="hero-icon"
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
                className="orb-btn"
                aria-label="Switch to voice demo"
                type="button"
                onClick={switchToVoice}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="hero-icon"
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
        ) : (
          <div className="hero-demo-centerLayout">
            <div className="hero-demo-orbLargeWrap">
              <OrbLarge
                state={
                  voiceState === "speaking"
                    ? "happy"
                    : (orbState as
                        | "idle"
                        | "listening"
                        | "thinking"
                        | "speaking"
                        | "sad")
                }
              />
            </div>

            <div className="hero-demo-voiceBlock">
              <p className="hero-demo-voiceLine">
                {voiceState === "listening" &&
                  "Ask me for ideas, recommendations, or general guidance."}
                {voiceState === "thinking" &&
                  "Thinking about the best suggestion for you..."}
                {voiceState === "speaking" &&
                  "I can guide you and help you decide. For exact products, prices, and filters, tap below to continue in chat."}
                {voiceState === "idle" &&
                  "Tap the mic and talk to me."}
                {voiceState === "permission" &&
                  "Checking microphone access..."}
                {voiceState === "error" &&
                  (assistantTranscript || "Voice session setup failed.")}
              </p>

              {(userTranscript || assistantTranscript) && (
                <div className="hero-demo-voiceTranscript">
                  {userTranscript ? (
                    <p className="hero-demo-voiceUser">
                      <strong>You:</strong> {userTranscript}
                    </p>
                  ) : null}

                  {assistantTranscript ? (
                    <p className="hero-demo-voiceAssistant">
                      <strong>Tiko:</strong> {assistantTranscript}
                    </p>
                  ) : null}
                </div>
              )}

              <p className="hero-demo-voiceHint">
                {voiceSessionInfo?.ready
                  ? "Voice preview connected. Tap chat for exact products and prices."
                  : "Voice preview mode. Tap chat to continue with product results."}
              </p>
            </div>

            <div className="hero-demo-controls">
              <button
                className="orb-btn"
                aria-label="Switch to chat demo"
                type="button"
                onClick={switchToChat}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="hero-icon"
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
  className="orb-btn is-active"
  aria-label="Toggle voice demo"
  type="button"
  onClick={() => {
    if (realtimeConnRef.current) {
      stopVoiceSession();
      setCurrentMode("voice");
      setAssistantTranscript("Tap the mic to talk again.");
      return;
    }

    handleVoiceClick();
  }}
>
                <svg
                  viewBox="0 0 24 24"
                  className="hero-icon"
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
        )}

        <div className="hero-modal-cta">
          <a className="button" href="/signup?plan=pro">
            Free Pro 14-day trial
          </a>
          <p className="hero-modal-trust">
            No credit card required.
            {typeof remaining === "number"
              ? ` ${remaining} left today.`
              : ""}
          </p>
        </div>

        {error ? (
          <div className="hero-demo-error">
            {error === "Daily limit reached" ? "That’s today’s set." : error}
          </div>
        ) : null}
      </div>
    </div>
  );
}