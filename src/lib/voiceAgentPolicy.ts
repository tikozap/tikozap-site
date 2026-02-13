// src/lib/voiceAgentPolicy.ts
export function looksLikeOrderStatusRequest(text: string): boolean {
  const t = (text || "").toLowerCase();
  return (
    t.includes("order status") ||
    t.includes("where is my order") ||
    t.includes("tracking") ||
    t.includes("track my") ||
    t.includes("delivered") ||
    t.includes("shipping status")
  );
}

export function orderStatusCollectionReply(): string {
  return [
    "I can help collect the details for our team.",
    "Please say your order number, and the email used at checkout.",
    "You can also press 0 to leave a message, or press 1 to request a callback.",
  ].join(" ");
}
