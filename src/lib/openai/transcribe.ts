// src/lib/openai/transcribe.ts
import "server-only";

import OpenAI from "openai";

function looksLikePlaceholderKey(key: string) {
  const k = (key || "").trim().toLowerCase();
  if (!k) return true;
  return k.includes("your_key") || k.includes("replace") || k === "sk-xxxxx" || k === "sk-your-key-here";
}

export async function transcribeAudio(args: {
  bytes: Uint8Array;
  filename: string;
  contentType: string;
}): Promise<string> {
  const key = (process.env.OPENAI_API_KEY || "").trim();
  if (!key || looksLikePlaceholderKey(key)) {
    return ""; // safe: no transcription if OpenAI key missing
  }

  const client = new OpenAI({ apiKey: key });

  // Node/Next provides Blob/File in runtime; Vercel Node runtime supports this.
  const blob = new Blob([args.bytes], { type: args.contentType });
  const file = new File([blob], args.filename, { type: args.contentType });

  // "whisper-1" is stable. (You can swap later.)
  const out = await client.audio.transcriptions.create({
    model: "whisper-1",
    file,
  });

  const text = (out?.text || "").trim();
  return text;
}
