import type { Conversation, ConversationStatus, MessageRole } from './types';
import { DEMO_CONVERSATIONS } from './demo';

const KEY = 'tz_demo_conversations_v1';

function DEMO_CONVERSATIONS_SAFE(): Conversation[] {
  return JSON.parse(JSON.stringify(DEMO_CONVERSATIONS)) as Conversation[];
}

export function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return DEMO_CONVERSATIONS_SAFE();

  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const fresh = DEMO_CONVERSATIONS_SAFE();
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : DEMO_CONVERSATIONS_SAFE();
  } catch {
    const fresh = DEMO_CONVERSATIONS_SAFE();
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }
}

export function saveConversations(convos: Conversation[]) {
  localStorage.setItem(KEY, JSON.stringify(convos));
}

export function resetConversations(): Conversation[] {
  const fresh = DEMO_CONVERSATIONS_SAFE();
  localStorage.setItem(KEY, JSON.stringify(fresh));
  return fresh;
}

export function updateConversationStatus(convos: Conversation[], id: string, status: ConversationStatus) {
  const now = Date.now();
  return convos.map((c) => (c.id === id ? { ...c, status, updatedAt: now } : c));
}

export function setConversationTags(convos: Conversation[], id: string, tags: string[]) {
  const now = Date.now();
  const normalized = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)));
  return convos.map((c) => (c.id === id ? { ...c, tags: normalized, updatedAt: now } : c));
}

export function setConversationAi(convos: Conversation[], id: string, aiEnabled: boolean) {
  const now = Date.now();
  return convos.map((c) => (c.id === id ? { ...c, aiEnabled, updatedAt: now } : c));
}

// Optional (not used yet): return this chat to “follow global”
export function clearConversationAiOverride(convos: Conversation[], id: string) {
  const now = Date.now();
  return convos.map((c) => {
    if (c.id !== id) return c;
    const copy: Conversation = { ...c, updatedAt: now };
    delete copy.aiEnabled;
    return copy;
  });
}

export function addMessage(convos: Conversation[], id: string, role: MessageRole, text: string) {
  const now = Date.now();
  return convos.map((c) => {
    if (c.id !== id) return c;
    return {
      ...c,
      updatedAt: now,
      messages: [...c.messages, { id: `m_${now}_${Math.random().toString(16).slice(2)}`, role, text, ts: now }],
    };
  });
}

export function createConversation(convos: Conversation[], convo: Conversation) {
  return [convo, ...convos].sort((a, b) => b.updatedAt - a.updatedAt);
}
