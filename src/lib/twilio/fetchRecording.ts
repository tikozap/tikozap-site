// src/lib/twilio/fetchRecording.ts
import "server-only";

function requireTwilioCreds() {
  const sid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  if (!sid || !token) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
  }
  return { sid, token };
}

/**
 * Twilio sends RecordingUrl without extension.
 * You can usually fetch as .wav or .mp3.
 */
function normalizeRecordingUrl(url: string) {
  const u = url.trim();
  if (!u) return "";
  if (u.endsWith(".wav") || u.endsWith(".mp3")) return u;
  // default to wav for transcription quality
  return `${u}.wav`;
}

export async function fetchTwilioRecording(recordingUrlRaw: string): Promise<{
  bytes: Uint8Array;
  contentType: string;
  filename: string;
}> {
  const recordingUrl = normalizeRecordingUrl(recordingUrlRaw);
  if (!recordingUrl) throw new Error("Missing recordingUrl");

  const { sid, token } = requireTwilioCreds();
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  const res = await fetch(recordingUrl, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
    },
    // Twilio recordings can be a bit slow; don't cache
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch recording (${res.status}): ${text.slice(0, 200)}`);
  }

  const contentType = res.headers.get("content-type") || "audio/wav";
  const ab = await res.arrayBuffer();
  const bytes = new Uint8Array(ab);

  const filename = recordingUrl.endsWith(".mp3") ? "voicemail.mp3" : "voicemail.wav";
  return { bytes, contentType, filename };
}
