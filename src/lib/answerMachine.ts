// src/lib/answerMachine.ts
import 'server-only';

import { prisma } from '@/lib/prisma';
import type { AnswerMachineType, AnswerMachineStatus } from '@prisma/client';

export type MsgRole = 'customer' | 'assistant' | 'staff' | 'note' | 'system';

export async function ensurePhoneConversation(args: {
  tenantId: string;
  fromNumber?: string | null;
  subject?: string;
}) {
  // One conversation per call (simple + clean). Webhook route handles idempotency via CallSession.
  return prisma.conversation.create({
    data: {
      tenantId: args.tenantId,
      channel: 'phone',
      status: 'open',
      customerName: args.fromNumber ? `Caller ${args.fromNumber}` : 'Caller',
      subject: args.subject || 'Phone Support',
      tags: 'phone',
      lastMessageAt: new Date(),
    },
  });
}

export async function addMessage(args: {
  conversationId: string;
  role: MsgRole;
  content: string;
}) {
  // Keep roles compatible with the Inbox UI
  const role = args.role === 'system' ? 'note' : args.role; // optional: store system logs as notes
  await prisma.message.create({
    data: { conversationId: args.conversationId, role, content: args.content },
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
  reason: string;
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
      status: 'NEW',
    },
  });
}

export async function attachVoicemailRecording(args: {
  answerMachineItemId: string;
  recordingUrl?: string | null;
  transcriptText?: string | null;
  status?: AnswerMachineStatus;
}) {
  return prisma.answerMachineItem.update({
    where: { id: args.answerMachineItemId },
    data: {
      recordingUrl: args.recordingUrl || null,
      transcriptText: args.transcriptText || null,
      status: args.status || 'IN_PROGRESS', // recording received; transcription pending
    },
  });
}