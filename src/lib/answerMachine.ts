// src/lib/answerMachine.ts
import { prisma } from "@/lib/prisma";
import type { AnswerMachineType } from "@prisma/client";

export async function ensurePhoneConversation(args: {
  tenantId: string;
  fromNumber?: string | null;
  subject?: string;
}) {
  // Always create a new phone conversation for a new call (simple + clean)
  const conv = await prisma.conversation.create({
    data: {
      tenantId: args.tenantId,
      channel: "phone",
      status: "open",
      customerName: args.fromNumber ? `Caller ${args.fromNumber}` : "Caller",
      subject: args.subject || "Phone Support",
      tags: "phone",
      lastMessageAt: new Date(),
    },
  });
  return conv;
}

export async function addMessage(args: {
  conversationId: string;
  role: "system" | "user" | "assistant";
  content: string;
}) {
  await prisma.message.create({
    data: { conversationId: args.conversationId, role: args.role, content: args.content },
  });
  await prisma.conversation.update({
    where: { id: args.conversationId },
    data: { lastMessageAt: new Date() },
  });
}

export async function createAnswerMachineItem(args: {
  tenantId: string;
  conversationId: string;
  callSessionId?: string | null;
  type: AnswerMachineType; // VOICEMAIL | CALLBACK
  fromNumber?: string | null;
  reason: string; // after_hours | dtmf_0 | dtmf_1 | fallback | disabled
  callbackNumber?: string | null;
  callbackNotes?: string | null;
}) {
  return prisma.answerMachineItem.create({
    data: {
      tenantId: args.tenantId,
      conversationId: args.conversationId,
      callSessionId: args.callSessionId || null,
      type: args.type,
      fromNumber: args.fromNumber || null,
      reason: args.reason,
      callbackNumber: args.callbackNumber || null,
      callbackNotes: args.callbackNotes || null,
    },
  });
}

export async function attachVoicemailRecording(args: {
  answerMachineItemId: string;
  recordingUrl?: string | null;
  transcriptText?: string | null;
}) {
  return prisma.answerMachineItem.update({
    where: { id: args.answerMachineItemId },
    data: {
      recordingUrl: args.recordingUrl || null,
      transcriptText: args.transcriptText || null,
      status: "NEW",
    },
  });
}