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

type VoiceTranscriptItem = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const starterMessages: DemoMessage[] = [
  {
    id: "a-1",
    role: "assistant",
    text: "Hi! I’m Tiko. How can I help you today?",
  },
];

export default function HeroDemoPanel() {
  const [mode, setMode] = useState<Mode>("idle");
  const [composerMode, setComposerMode] = useState<ComposerMode>("type");
  const [orbOpen, setOrbOpen] = useState(false);
  const [messages, setMessages] = useState<DemoMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
const [conversationId, setConversationId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
const [holdingToTalk, setHoldingToTalk] = useState(false);
const recognitionRef = useRef<any>(null);
const transcriptRef = useRef("");

const [voiceState, setVoiceState] = useState<VoiceSessionState>("idle");
const [userTranscript, setUserTranscript] = useState("");
const [assistantTranscript, setAssistantTranscript] = useState("");

const realtimeConnRef = useRef<any>(null);
const userTranscriptBufferRef = useRef("");
const assistantTranscriptBufferRef = useRef("");

const [voiceTranscriptEnabled, setVoiceTranscriptEnabled] = useState(false);
const [voiceTranscriptItems, setVoiceTranscriptItems] = useState<
  VoiceTranscriptItem[]
>([]);
const [transcriptCopied, setTranscriptCopied] = useState(false);

const activeUserTranscriptIdRef = useRef<string | null>(null);
const activeAssistantTranscriptIdRef = useRef<string | null>(null);
const voiceTranscriptBodyRef = useRef<HTMLDivElement | null>(null);

function createTranscriptId(role: "assistant" | "user") {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function updateVoiceTranscriptItem(
  id: string,
  role: "assistant" | "user",
  text: string
) {
  setVoiceTranscriptItems((current) => {
    const existingIndex = current.findIndex((item) => item.id === id);

    if (existingIndex === -1) {
      return [...current, { id, role, text }];
    }

    return current.map((item) =>
      item.id === id
        ? {
            ...item,
            text,
          }
        : item
    );
  });
}

function clearVoiceTranscript() {
  setVoiceTranscriptItems([]);
  setTranscriptCopied(false);

  activeUserTranscriptIdRef.current = null;
  activeAssistantTranscriptIdRef.current = null;
  userTranscriptBufferRef.current = "";
  assistantTranscriptBufferRef.current = "";
}

async function copyVoiceTranscript() {
  const transcriptText = voiceTranscriptItems
    .filter((item) => item.text.trim())
    .map((item) => {
      const speaker = item.role === "user" ? "You" : "Tiko";
      return `${speaker}:\n${item.text.trim()}`;
    })
    .join("\n\n");

  if (!transcriptText) return;

  try {
    await navigator.clipboard.writeText(transcriptText);
    setTranscriptCopied(true);

    window.setTimeout(() => {
      setTranscriptCopied(false);
    }, 1600);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = transcriptText;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    textarea.remove();

    setTranscriptCopied(true);

    window.setTimeout(() => {
      setTranscriptCopied(false);
    }, 1600);
  }
}

function openPanel(nextMode: ComposerMode = "type") {
  setComposerMode(nextMode);
  setMode("panel");
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
  activeUserTranscriptIdRef.current = null;
activeAssistantTranscriptIdRef.current = null;

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
  setOrbOpen(true);
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
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    mode: "marketing",
  }),
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

  if (voiceTranscriptEnabled) {
    if (!activeUserTranscriptIdRef.current) {
      activeUserTranscriptIdRef.current = createTranscriptId("user");
    }

    updateVoiceTranscriptItem(
      activeUserTranscriptIdRef.current,
      "user",
      trimmed
    );
  }
},

onAssistantTranscript: (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return;

  const previous = assistantTranscriptBufferRef.current.trim();

  if (!previous) {
    assistantTranscriptBufferRef.current = trimmed;
  } else if (trimmed === previous) {
    return;
  } else if (trimmed.startsWith(previous)) {
    assistantTranscriptBufferRef.current = trimmed;
  } else if (previous.startsWith(trimmed)) {
    return;
  } else {
    assistantTranscriptBufferRef.current = trimmed;
  }

  const completedText = assistantTranscriptBufferRef.current;
  setAssistantTranscript(completedText);

  if (voiceTranscriptEnabled) {
    if (!activeAssistantTranscriptIdRef.current) {
      activeAssistantTranscriptIdRef.current =
        createTranscriptId("assistant");
    }

    updateVoiceTranscriptItem(
      activeAssistantTranscriptIdRef.current,
      "assistant",
      completedText
    );
  }
},

onUserSpeechStart: () => {
  userTranscriptBufferRef.current = "";
  activeUserTranscriptIdRef.current = createTranscriptId("user");
  setVoiceState("listening");
},

onUserSpeechStop: () => {
  activeUserTranscriptIdRef.current = null;
  setVoiceState("thinking");
},

onAssistantSpeechStart: () => {
  assistantTranscriptBufferRef.current = "";
  activeAssistantTranscriptIdRef.current =
    createTranscriptId("assistant");

  setAssistantTranscript("");
  setVoiceState("speaking");
},

onAssistantSpeechStop: () => {
  activeAssistantTranscriptIdRef.current = null;
  setVoiceState("listening");
},

onInterrupted: () => {
  activeAssistantTranscriptIdRef.current = null;
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

function dismissKeyboard() {
  if (typeof document === "undefined") return;
  const el = document.activeElement as HTMLElement | null;
  el?.blur?.();
}

function toggleVoiceSession() {
  if (realtimeConnRef.current) {
    stopVoiceSession();
    return;
  }

  startVoiceSession();
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
        mode: "marketing",
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
}
}

useEffect(() => {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);

  setVoiceTranscriptEnabled(params.get("tikoTranscript") === "1");
}, []);

useEffect(() => {
  const transcriptBody = voiceTranscriptBodyRef.current;
  if (!transcriptBody) return;

  transcriptBody.scrollTop = transcriptBody.scrollHeight;
}, [voiceTranscriptItems]);

useEffect(() => {
  const scrollLatest = () => {
    const el = bodyRef.current;
    if (!el) return;

el.scrollTo({
  top: el.scrollHeight,
  behavior: "auto",
});
  };

  scrollLatest();
  requestAnimationFrame(scrollLatest);
  window.setTimeout(scrollLatest, 80);
  window.setTimeout(scrollLatest, 180);
}, [messages]);

useEffect(() => {
  if (typeof window === "undefined") return;
  if (window.innerWidth >= 768) return;
  if (mode !== "panel") return;

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
}, [mode]);

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

    transcriptRef.current = text.trim();
  };

  recognition.onend = () => {
    const spoken = transcriptRef.current.trim();
    setHoldingToTalk(false);

    try {
      recognition.abort?.();
    } catch {}

    if (!spoken) return;

    setInput(spoken);
    setComposerMode("type");

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  recognition.onerror = () => {
    setHoldingToTalk(false);
  };

  recognitionRef.current = recognition;

  return () => {
    try {
      recognition.stop();
    } catch {}

    recognitionRef.current = null;
  };
}, []);

function startVoiceCapture() {
  if (!recognitionRef.current || sending) return;

  transcriptRef.current = "";
  setHoldingToTalk(true);

  try {
    recognitionRef.current.start();
  } catch {}
}

function stopVoiceCapture() {
  setHoldingToTalk(false);

  const recognition = recognitionRef.current;

  try {
    recognition?.stop();
  } catch {}

  window.setTimeout(() => {
    try {
      recognition?.abort?.();
    } catch {}
  }, 250);
}

function toggleTextSpeechCapture() {
  if (holdingToTalk) {
    stopVoiceCapture();
    return;
  }

  setOrbOpen(false);
  setComposerMode("speak");
  inputRef.current?.blur();
  startVoiceCapture();
}

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
              onClick={toggleVoiceSession}
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
<div className="hero-chatSafeZone">
          <div className="hero-starterChat">
            <div className="hero-starterChat-head">
<div className="hero-starterChat-menuSpacer" aria-hidden="true" />

<div className="hero-starterChat-title">
  <button
    type="button"
    className="hero-starterChat-titleBtn"
    aria-label={orbOpen ? "Orb mode" : "Return to orb mode"}
    onClick={() => {
      setOrbOpen(true);
      setComposerMode("speak");
      inputRef.current?.blur();
    }}
  >
    {!orbOpen ? (
      <span className="hero-starterChat-orb" aria-hidden="true">
        <Orb state="idle" tiltX={0} tiltY={0} />
      </span>
    ) : null}
    Tiko
  </button>
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

            {orbOpen ? (
              <div className="hero-voiceBody">
<button
  type="button"
  className="hero-voiceOrbBtn"
  aria-label="Open chat mode"
  onClick={() => {
    setOrbOpen(false);
    setComposerMode("type");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }}
>
  <div className="hero-voiceOrb">
<OrbLarge
  state={
    voiceState === "permission"
      ? "thinking"
      : voiceState === "error"
      ? "sad"
      : voiceState === "paused"
      ? "idle"
      : voiceState
  }
/>
  </div>
</button>

                <div className="hero-voiceControls">
                  <button
                    type="button"
                    className="hero-voiceMiniBtn"
                    aria-label="Switch to typing"
                    onClick={() => {
                      stopVoiceSession();
                      setOrbOpen(false);
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
  onClick={toggleVoiceSession}
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

{voiceTranscriptEnabled ? (
  <section
    className="hero-voiceTranscript"
    aria-label="Temporary voice transcript"
  >
    <div className="hero-voiceTranscript-head">
      <strong>Voice transcript</strong>

      <div className="hero-voiceTranscript-actions">
        <button
          type="button"
          onClick={copyVoiceTranscript}
          disabled={voiceTranscriptItems.length === 0}
        >
          {transcriptCopied ? "Copied" : "Copy"}
        </button>

        <button
          type="button"
          onClick={clearVoiceTranscript}
          disabled={voiceTranscriptItems.length === 0}
        >
          Clear
        </button>
      </div>
    </div>

    <div
      ref={voiceTranscriptBodyRef}
      className="hero-voiceTranscript-body"
    >
      {voiceTranscriptItems.length === 0 ? (
        <p className="hero-voiceTranscript-empty">
          Start speaking. Your conversation with Tiko will appear here.
        </p>
      ) : (
        voiceTranscriptItems.map((item) => (
          <div
            key={item.id}
            className={`hero-voiceTranscript-item ${
              item.role === "user"
                ? "hero-voiceTranscript-user"
                : "hero-voiceTranscript-assistant"
            }`}
          >
            <div className="hero-voiceTranscript-speaker">
              {item.role === "user" ? "You" : "Tiko"}
            </div>

            <div className="hero-voiceTranscript-text">
              {item.text}
            </div>
          </div>
        ))
      )}
    </div>
  </section>
) : null}

              </div>
            ) : (
<div
  ref={bodyRef}
  className="hero-starterChat-body"
  onPointerDown={() => {
    dismissKeyboard();
  }}
>
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

            {!orbOpen ? (
  <form className="hero-starterChat-inputRow" onSubmit={sendMessage}>
<button
  className="hero-starterChat-sound"
  type="button"
  aria-label={composerMode === "speak" ? "Switch to typing" : "Switch to voice"}
  onClick={() => {
    if (composerMode === "speak") {
      setComposerMode("type");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      stopVoiceSession();
      setOrbOpen(false);
      setComposerMode("speak");
      inputRef.current?.blur();
    }
  }}
>
  {composerMode === "speak" ? (
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
  ) : (
    <img
      src="/talk-waves.svg"
      alt=""
      aria-hidden="true"
      className="hero-starterChat-soundImg"
    />
  )}
</button>

{composerMode === "speak" ? (
<button
  type="button"
  className={`hero-starterChat-holdField ${holdingToTalk ? "is-listening" : ""}`}
  onClick={toggleTextSpeechCapture}
>
  {holdingToTalk ? "Listening..." : "Tap to speak"}
</button>
) : (
<textarea
  ref={inputRef}
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onFocus={() => {
    window.setTimeout(() => {
      const el = bodyRef.current;
      if (!el) return;

      el.scrollTo({
        top: el.scrollHeight,
        behavior: "auto",
      });
    }, 250);
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as any);
    }
  }}
  placeholder="Ask TikoZap..."
  className="hero-starterChat-input"
/>
)}

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
  position: fixed;
  top: 96px;
  right: max(16px, calc((100vw - 1280px) / 2));
  z-index: 1000;
  padding: 0;
  margin: 0;
}

        .hero-starterChat {
          width: min(420px, 92vw);
          height: min(648px, calc(100vh - 120px));
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
          padding: 1rem 0.75rem 24px;
          overflow-y: auto;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

.hero-starterChat-msg {
  max-width: 84%;
  border-radius: 18px;
  padding: 14px 18px;
  font-size: 16px;
  line-height: 1.45;
  font-weight: 400;
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
  overflow: hidden;
}

.hero-voiceBody:has(.hero-voiceTranscript) {
  justify-content: flex-start;
  padding-top: 10px;
}

.hero-voiceOrb {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

        .hero-voiceControls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 2rem;
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
          min-height: 62px;
          height: auto;
          grid-template-columns: 38px 1fr 46px;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
          display: grid;
          align-items: end;
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
  min-height: 42px;
  max-height: 108px;
  resize: none;
  overflow-y: auto;
  line-height: 1.4;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  padding: 10px 0.75rem;
  font-size: 16px;
  outline: none;
}

.hero-starterChat-input:focus {
  border-color: #cbd5e1;
  box-shadow: none;
}

        .hero-starterChat-body {
          overscroll-behavior: contain;
        }  

        .hero-voiceOrbBtn {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.hero-starterChat-titleBtn {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  cursor: pointer;
  padding: 0;
}

.hero-starterChat-holdField {
  min-width: 0;
  height: 36px;
  border: 1px solid #dbe3ef;
  border-radius: 999px;
  background: #ffffff;
  color: #94a3b8;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.hero-starterChat-holdField.is-listening {
  border-color: #2563eb;
  background: #eff6ff;
  color: #2563eb;
}

.hero-voiceTranscript {
  width: calc(100% - 28px);
  max-height: 205px;
  margin: 12px 14px 14px;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #f8fafc;
  overflow: hidden;
  text-align: left;
}

.hero-voiceTranscript-head {
  min-height: 42px;
  padding: 7px 10px 7px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  color: #111827;
}

.hero-voiceTranscript-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hero-voiceTranscript-actions button {
  min-height: 28px;
  padding: 4px 9px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.hero-voiceTranscript-actions button:disabled {
  cursor: default;
  opacity: 0.45;
}

.hero-voiceTranscript-body {
  max-height: 160px;
  padding: 10px;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.hero-voiceTranscript-item {
  font-size: 13px;
  line-height: 1.45;
}

.hero-voiceTranscript-speaker {
  margin-bottom: 2px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.hero-voiceTranscript-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #111827;
}

.hero-voiceTranscript-user {
  padding-left: 30px;
}

.hero-voiceTranscript-user .hero-voiceTranscript-speaker {
  color: #2563eb;
}

.hero-voiceTranscript-assistant {
  padding-right: 20px;
}

.hero-voiceTranscript-assistant .hero-voiceTranscript-speaker {
  color: #7c3aed;
}

.hero-voiceTranscript-empty {
  margin: 0;
  padding: 8px 4px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.45;
}

@media (max-width: 767px) {
  .hero-demoPanel {
    min-height: 540px;
  }

  .hero-starterChat {
    width: min(400px, 96vw);
    height: 560px;
    border-radius: 20px;
  }

  .hero-chatSafeZone {
    padding: 0;
    margin: 0;
  }

  .hero-voiceBody {
    padding: 18px 0 22px;
  }

.hero-voiceOrb {
  margin-bottom: 0;
}

  .hero-voiceControls {
    margin-top: 4rem;
    gap: 1.8rem;
  }

  .hero-starterChat-body {
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }
}

@media (max-width: 767px) {
  .hero-chatSafeZone {
    position: fixed;
    inset: 0;
    z-index: 9999;
    padding: 0;
    margin: 0;
    background: #ffffff;
    display: block;
  }

  .hero-starterChat {
    width: 100vw;
    height: 100svh;
    border-radius: 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .hero-starterChat-head {
    border-radius: 0;
    flex: 0 0 auto;
  }

  .hero-starterChat-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
  }

.hero-starterChat-inputRow {
  position: fixed;
  left: 0;
  right: 0;
  bottom: env(safe-area-inset-bottom);
  z-index: 10001;
}

.hero-starterChat-body {
  padding-bottom: 110px;
}

.hero-voiceTranscript {
  max-height: 250px;
  margin-bottom: calc(14px + env(safe-area-inset-bottom));
}

.hero-voiceTranscript-body {
  max-height: 202px;
}
}

@media (max-width: 767px){
  .hero-chatSafeZone{
    position:fixed;
    inset:0;
    width:100%;
    height:100dvh;
    padding:0;
    margin:0;
    z-index:1000;
  }

  .hero-starterChat{
    position:absolute;
    inset:0;

    width:100%;
    height:100%;
    max-height:none;

    border-radius:0;
    overflow:hidden;

    display:flex;
    flex-direction:column;
  }

  .hero-starterChat-head{
    flex:0 0 54px;
    height:54px;
    border-radius:0;
    position:relative;
    z-index:30;
  }

  .hero-starterChat-body{
    flex:1 1 auto;
    min-height:0;
    overflow-y:auto;
    overscroll-behavior:contain;
    -webkit-overflow-scrolling:touch;
    touch-action:pan-y;
  }

  .hero-starterChat-inputRow{
    flex:0 0 auto;
    position:relative;
    bottom:auto;
    z-index:30;
  }
}
      `}</style>
    </aside>
  );
}