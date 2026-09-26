// src/lib/widgetKey.ts
import crypto from "node:crypto";

export function newWidgetPublicKey() {
  // 16 bytes => 32 hex chars
  const hex = crypto.randomBytes(16).toString("hex");
  return `tz_${hex}`;
}

export function isTzWidgetKey(key: string | null | undefined) {
  return typeof key === "string" && /^tz_[0-9a-f]{32}$/i.test(key);
}