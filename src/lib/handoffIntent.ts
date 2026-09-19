// src/lib/handoffIntent.ts

export function wantsHuman(input: string) {
  const text = String(input || "").toLowerCase();

  if (text.includes("operator")) return true;
  if (text.includes("representative")) return true;
  if (text.includes("live agent")) return true;
  if (text.includes("live person")) return true;
  if (text.includes("human agent")) return true;

  const directHumanWords =
    /\b(human|person|agent|staff|manager|supervisor|owner)\b/i;

  const requestVerbs =
    /\b(speak|talk|chat|connect|transfer|reach|get|need|want)\b/i;

  if (directHumanWords.test(text) && requestVerbs.test(text)) {
    return true;
  }

  const phrases = [
    "talk to someone",
    "speak to someone",
    "talk with someone",
    "speak with someone",
    "real person",
    "customer service",
    "support staff",
    "store team",
    "store owner",
    "contact support",
    "talk to support",
    "speak to support",
    "need help from someone",
    "can someone help",
    "call me",
  ];

  return phrases.some((phrase) => text.includes(phrase));
}