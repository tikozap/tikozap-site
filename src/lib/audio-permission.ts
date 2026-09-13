// src/lib/audio-permission.ts

export async function requestMicPermission() {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    return {
      ok: false as const,
      reason: "unsupported",
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());

    return {
      ok: true as const,
    };
  } catch (error) {
    return {
      ok: false as const,
      reason: "denied",
      error,
    };
  }
}