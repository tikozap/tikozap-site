// src/lib/voice-state.ts

export type VoiceSessionState =
  | "idle"
  | "permission"
  | "listening"
  | "thinking"
  | "speaking"
  | "paused"
  | "error";