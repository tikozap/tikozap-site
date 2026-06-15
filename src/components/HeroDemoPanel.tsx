// src/components/HeroDemoPanel.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Orb } from "@/components/Orb";
import { OrbLarge } from "@/components/OrbLarge";
import { requestMicPermission } from "@/lib/audio-permission";
import { connectRealtime } from "@/lib/realtime-webrtc";
import type { VoiceSessionState } from "@/lib/voice-state";

type Mode = "idle" | "panel";
type ComposerMode = "type" | "speak";

type DemoMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const starterMessages: DemoMessage[] = [
  { id: "u-1", role: "user", text: "hi there" },
  { id: "a-1", role: "assistant", text: "Hello! How can I assist you today?" },
  { id: "u-2", role: "user", text: "I need human" },
  {
    id: "a-2",
    role: "assistant",
    text:
      "I’ve notified the store team and left a message for them.\n\nThey’ll review this conversation and get back to you as soon as possible.\n\nWhile you wait, I’m still here if you’d like help with order status, shipping, returns, or product questions.",
  },
];

export default function HeroDemoPanel() {
  const [mode, setMode] = useState<Mode>("idle");
  const [composerMode, setComposerMode] = useState<ComposerMode>("type");
  const [messages, setMessages] = useState<DemoMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
const [conversationId, setConversationId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chatHoverRef = useRef(false);
const [voiceState, setVoiceState] = useState<VoiceSessionState>("idle");
const [userTranscript, setUserTranscript] = useState("");
const [assistantTranscript, setAssistantTranscript] = useState("");

const realtimeConnRef = useRef<any>(null);
const userTranscriptBufferRef = useRef("");
const assistantTranscriptBufferRef = useRef("");

  function openPanel(nextMode: ComposerMode = "type") {
    setComposerMode(nextMode);
    setMode("panel");

    if (nextMode === "type") {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

function closePanel() {
  stopVoiceSession();
  setMode("idle");
}

function stopVoiceSession() {
  setVoiceState("idle");
  setUserTranscript("");
  setAssistantTranscript("");
  userTranscriptBufferRef.current = "";
  assistantTranscriptBufferRef.current = "";

  if (realtimeConnRef.current) {
    try {
      realtimeConnRef.current.dc.close();
    } catch {}

    try {
      realtimeConnRef.current.pc.getSenders().forEach((sender: any) => {
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

async function startVoiceSession() {
  if (
    realtimeConnRef.current ||
    voiceState === "permission" ||
    voiceState === "listening" ||
    voiceState === "thinking" ||
    voiceState === "speaking"
  ) {
    return;
  }

  setComposerMode("speak");
  setMode("panel");
  setVoiceState("permission");
  setUserTranscript("");
  setAssistantTranscript("Checking microphone permission...");

  const permission = await requestMicPermission();

  if (!permission.ok) {
    setVoiceState("error");
    setAssistantTranscript("Microphone access was denied or unsupported.");
    return;
  }

  setVoiceState("thinking");
  setAssistantTranscript("Connecting realtime voice...");

  try {
    const res = await fetch("/api/realtime/session", {
      method: "POST",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok || !data?.client_secret?.value) {
      setVoiceState("error");
      setAssistantTranscript(
        data?.error || "Failed to create realtime voice session."
      );
      return;
    }

    const conn = await connectRealtime(data.client_secret.value, {
      onUserTranscript: (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        userTranscriptBufferRef.current = trimmed;
        setUserTranscript(trimmed);
      },

      onAssistantTranscript: (text: string) => {
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
        setVoiceState("listening");
      },

      onUserSpeechStop: () => {
        setVoiceState("thinking");
      },

      onAssistantSpeechStart: () => {
        assistantTranscriptBufferRef.current = "";
        setAssistantTranscript("");
        setVoiceState("speaking");
      },

      onAssistantSpeechStop: () => {
        setVoiceState("listening");
      },

      onInterrupted: () => {
        assistantTranscriptBufferRef.current = "";
        setAssistantTranscript("");
        setVoiceState("listening");
      },

      onError: (message: string) => {
        setVoiceState("error");
        setAssistantTranscript(message);
      },
    });

    realtimeConnRef.current = conn;
    setVoiceState("listening");
    setAssistantTranscript("");
  } catch (e: any) {
    setVoiceState("error");
    setAssistantTranscript(e?.message || "Voice session setup failed.");
  }
}

async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const trimmed = input.trim();
  if (!trimmed || sending) return;

  setInput("");
  setSending(true);

  setMessages((prev) => [
    ...prev,
    { id: `u-${Date.now()}`, role: "user", text: trimmed },
    { id: `a-${Date.now() + 1}`, role: "assistant", text: "Thinking..." },
  ]);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: trimmed,
        conversationId,
        channel: "homepage-demo",
        tags: ["homepage-demo"],
        visitor: {
          name: "Homepage visitor",
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response stream");

    const decoder = new TextDecoder();
    let buf = "";
    let assistantText = "";
    const assistantId = `a-${Date.now() + 2}`;

    setMessages((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = {
        id: assistantId,
        role: "assistant",
        text: "",
      };
      return copy;
    });

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

        if (payload.type === "meta" && payload.conversationId) {
          setConversationId(payload.conversationId);
        }

        if (payload.type === "delta" && payload.delta) {
          assistantText += payload.delta;

          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];

            if (last?.role === "assistant") {
              copy[copy.length - 1] = {
                ...last,
                text: assistantText,
              };
            }

            return copy;
          });
        }
      }
    }
  } catch {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];

      if (last?.role === "assistant") {
        copy[copy.length - 1] = {
          ...last,
          text: "Sorry — I couldn’t connect right now. Please try again.",
        };
      }

      return copy;
    });
  } finally {
    setSending(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }
}

  useEffect(() => {
    function handleWheel() {
      if (window.innerWidth < 960) return;
      if (mode !== "panel") return;
      if (chatHoverRef.current) return;

      closePanel();
    }

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [mode]);

  return (
    <aside className="hero-demoPanel" aria-label="TikoZap live demo preview">
      {mode === "idle" ? (
        <div className="hero-orbOnly">
          <button
            type="button"
            className="hero-orbButton"
            aria-label="Open Tiko demo"
            onClick={() => openPanel("type")}
          >
            <Orb state="idle" tiltX={0} tiltY={0} />
          </button>

          <div className="hero-demoPanel-controls">
            <button
              className="orb-btn"
              aria-label="Open text chat demo"
              type="button"
              onClick={() => openPanel("type")}
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
              aria-label="Open voice demo"
              type="button"
              onClick={startVoiceSession}
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
      ) : null}

      {mode === "panel" ? (
        <div
          className="hero-chatSafeZone"
          onMouseEnter={() => {
            chatHoverRef.current = true;
          }}
          onMouseLeave={() => {
            chatHoverRef.current = false;
          }}
        >
          <div className="hero-starterChat">
            <div className="hero-starterChat-head">
              <button
                className="hero-starterChat-menu"
                type="button"
                aria-label="Menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4"
                    y="3"
                    width="16"
                    height="18"
                    rx="3"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="8"
                    y1="8"
                    x2="16"
                    y2="8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="8"
                    y1="12"
                    x2="16"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="8"
                    y1="16"
                    x2="13"
                    y2="16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              <div className="hero-starterChat-title">
                <span className="hero-starterChat-orb" aria-hidden="true">
                  <Orb state="idle" tiltX={0} tiltY={0} />
                </span>
                Tiko
              </div>

              <button
                className="hero-starterChat-close"
                type="button"
                aria-label="Close demo"
                onClick={closePanel}
              >
                ×
              </button>
            </div>

            {composerMode === "speak" ? (
              <div className="hero-voiceBody">
                <div className="hero-voiceOrb">
                  <Orb state="idle" tiltX={0} tiltY={0} />
                </div>

                <div className="hero-voiceControls">
                  <button
                    type="button"
                    className="hero-voiceMiniBtn"
                    aria-label="Switch to typing"
                    onClick={() => {
                      setComposerMode("type");
                      window.setTimeout(() => inputRef.current?.focus(), 0);
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
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>

<button
  type="button"
  className="hero-voiceMiniBtn"
  aria-label="Voice mode"
  onClick={startVoiceSession}
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
              <div className="hero-starterChat-body">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "hero-starterChat-msg hero-starterChat-msgUser"
                        : "hero-starterChat-msg hero-starterChat-msgAssistant"
                    }
                  >
                    {message.text}
                  </div>
                ))}
              </div>
            )}

            {composerMode === "type" ? (
              <form className="hero-starterChat-inputRow" onSubmit={sendMessage}>
                <button
                  className="hero-starterChat-sound"
                  type="button"
                  aria-label="Switch to voice"
                  onClick={() => setComposerMode("speak")}
                >
                  <img
                    src="/talk-waves.svg"
                    alt=""
                    aria-hidden="true"
                    className="hero-starterChat-soundImg"
                  />
                </button>

                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about products..."
                  className="hero-starterChat-input"
                />

               <button
  className="hero-starterChat-send"
  type="submit"
  disabled={sending || !input.trim()}
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
              </form>
            ) : null}
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .hero-demoPanel {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 360px;
        }

        .hero-orbOnly {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.1rem;
        }

        .hero-orbButton {
          border: 0;
          background: transparent;
          padding: 0;
          cursor: pointer;
          transform: scale(0.4);
        }

        .hero-demoPanel-controls {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        .orb-btn {
          width: 2.35rem;
          height: 2.35rem;
          border-radius: 999px;
          border: 1px solid #dbe3ef;
          background: #ffffff;
          color: #475569;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
        }

        .orb-btn:hover {
          color: #2563eb;
          border-color: #bfdbfe;
        }

        .hero-icon {
          width: 1rem;
          height: 1rem;
        }

        .hero-chatSafeZone {
          padding: 82px;
          margin: -82px;
        }

        .hero-starterChat {
          width: min(320px, 90vw);
          height: 500px;
          border-radius: 20px;
          overflow: hidden;
          background: #f8fafc;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
          display: flex;
          flex-direction: column;
        }

        .hero-starterChat-head {
          height: 54px;
          background: #0b74ff;
          color: #ffffff;
          display: grid;
          grid-template-columns: 42px 1fr 42px;
          align-items: center;
          padding: 0 0.25rem;
          font-weight: 700;
          font-size: 0.86rem;
          border-radius: 20px 20px 0 0;
        }

        .hero-starterChat-menu,
        .hero-starterChat-close {
          border: 0;
          background: transparent;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-starterChat-close {
          font-size: 1.3rem;
        }

        .hero-starterChat-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
        }

        .hero-starterChat-orb {
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .hero-starterChat-body {
          flex: 1;
          min-height: 0;
          padding: 1rem 0.75rem;
          overflow-y: auto;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .hero-starterChat-msg {
          max-width: 82%;
          border-radius: 0.95rem;
          padding: 0.55rem 0.7rem;
          font-size: 0.76rem;
          line-height: 1.35;
          white-space: pre-wrap;
        }

        .hero-starterChat-msgUser {
          align-self: flex-end;
          background: #0877ff;
          color: #ffffff;
          border-bottom-right-radius: 0.35rem;
        }

        .hero-starterChat-msgAssistant {
          align-self: flex-start;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          color: #111827;
          border-bottom-left-radius: 0.35rem;
        }

        .hero-voiceBody {
          flex: 1;
          min-height: 0;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .hero-voiceOrb {
          transform: scale(0.42);
          margin-bottom: 1rem;
        }

        .hero-voiceControls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-top: -1.5rem;
        }

        .hero-voiceMiniBtn {
          border: 0;
          background: transparent;
          color: #111827;
          cursor: pointer;
          padding: 0.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .hero-starterChat-inputRow {
          flex: 0 0 auto;
          height: 54px;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
          display: grid;
          grid-template-columns: 34px 1fr 42px;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.5rem;
        }

        .hero-starterChat-sound {
          border: 0;
          background: transparent;
          cursor: pointer;
          color: #64748b;
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .hero-starterChat-soundImg {
          width: 21px;
          height: 21px;
          display: block;
          object-fit: contain;
        }

        .hero-starterChat-send {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid #6ea8ff;
          background: #6ea8ff;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          cursor: pointer;
        }

        .hero-starterChat-input {
          min-width: 0;
          height: 36px;
          border: 1px solid #dbe3ef;
          border-radius: 999px;
          padding: 0 0.75rem;
          font-size: 0.76rem;
          outline: none;
        }

        .hero-starterChat-input:focus {
          border-color: #2563eb;
        }

        @media (max-width: 767px) {
          .hero-demoPanel {
            min-height: 280px;
          }

          .hero-starterChat {
            width: min(340px, 92vw);
            height: 430px;
          }

          .hero-chatSafeZone {
            padding: 0;
            margin: 0;
          }
        }
      `}</style>
    </aside>
  );
}