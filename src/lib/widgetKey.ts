// src/lib/widgetKey.ts
import { randomUUID } from "crypto";

export function newWidgetPublicKey() {
  return "tz_" + randomUUID().replace(/-/g, "");
}

export function isTzWidgetKey(k: string) {
  return /^tz_[0-9a-f]{32}$/i.test(String(k || ""));
}
