// src/lib/demoInboxStore.ts

type DemoRole = "customer" | "assistant" | "staff";

export type DemoInboxProduct = {
  id: string | number;
  title?: string;
  price?: number | string;
  image?: string | null;
  available?: boolean;
  url?: string;
};

export type DemoInboxMessage = {
  id: string;
  role: DemoRole;
  content: string;
  createdAt: string;
  products?: DemoInboxProduct[];
};

export type DemoInboxConversation = {
  id: string;
  tenantId: string;
  channel: string;
  subject: string;
  customerName: string;
  status: "open" | "waiting" | "closed";
  aiEnabled: boolean;
  tags: string[];
  archivedAt: string | null;
  needsHuman: boolean;
  unread: boolean;
  lastMessageAt: string;
  messages: DemoInboxMessage[];
};

type FindOrCreateArgs = {
  tenantId: string;
  conversationId?: string | null;
  customerName?: string | null;
  subject?: string | null;
  channel?: string | null;
  tags?: string[];
};

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

type DemoInboxGlobal = {
  conversations: Map<string, DemoInboxConversation>;
  seeded: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var __demoInboxStore__: DemoInboxGlobal | undefined;
}

function getGlobalStore(): DemoInboxGlobal {
  if (!globalThis.__demoInboxStore__) {
    globalThis.__demoInboxStore__ = {
      conversations: new Map<string, DemoInboxConversation>(),
      seeded: false,
    };
  }

  return globalThis.__demoInboxStore__;
}

function seedIfNeeded() {
  const g = getGlobalStore();
  if (g.seeded) return;

  const seeded: DemoInboxConversation[] = [
    {
      id: "demo-1",
      tenantId: "demo-tenant",
      customerName: "Emily R.",
      subject: "Show me jackets",
      status: "open",
      channel: "web",
      aiEnabled: true,
      tags: ["product"],
      lastMessageAt: nowIso(),
      archivedAt: null,
      needsHuman: false,
      unread: false,
      messages: [
        {
          id: "demo-1-m1",
          role: "customer",
          content: "Show me jackets",
          createdAt: nowIso(),
        },
        {
          id: "demo-1-m2",
          role: "assistant",
          content: "Here are a few jacket options you might like.",
          createdAt: nowIso(),
        },
      ],
    },
    {
      id: "demo-2",
  tenantId: "demo-tenant",
  customerName: "John D. · Order #1438",
  subject: "Where is my order?",
  status: "waiting",
  channel: "email",
  aiEnabled: false,
  tags: [],
      lastMessageAt: nowIso(),
      archivedAt: null,
      needsHuman: true,
      unread: true,
      messages: [
        {
          id: "demo-2-m1",
          role: "customer",
          content: "Where is my order? I placed it last week.",
          createdAt: nowIso(),
        },
      ],
    },
    {
      id: "demo-3",
      tenantId: "demo-tenant",
      customerName: "Sophia",
      subject: "Return policy question",
      status: "open",
      channel: "web",
      aiEnabled: true,
      tags: ["returns"],
      lastMessageAt: nowIso(),
      archivedAt: null,
      needsHuman: false,
      unread: false,
      messages: [
        {
          id: "demo-3-m1",
          role: "customer",
          content: "What is your return policy?",
          createdAt: nowIso(),
        },
        {
          id: "demo-3-m2",
          role: "assistant",
          content:
            "I can help with returns, exchanges, or cancellations. Tell me what happened and I’ll guide you.",
          createdAt: nowIso(),
        },
      ],
    },
  ];

  for (const c of seeded) {
    g.conversations.set(c.id, c);
  }

  g.seeded = true;
}

export function listDemoInboxConversations(includeArchived = false) {
  seedIfNeeded();
  const g = getGlobalStore();

  const items = Array.from(g.conversations.values())
    .filter((c) => (includeArchived ? true : !c.archivedAt))
    .sort((a, b) => {
      const bt = new Date(b.lastMessageAt).getTime();
      const at = new Date(a.lastMessageAt).getTime();
      return bt - at;
    });

  return items.map((c) => ({
    id: c.id,
    customerName: c.customerName,
    subject: c.subject,
    status: c.status,
    channel: c.channel,
    aiEnabled: c.aiEnabled,
    tags: c.tags,
    lastMessageAt: c.lastMessageAt,
    archivedAt: c.archivedAt,
    needsHuman: c.needsHuman,
    unread: c.unread,
    preview: c.messages.length
      ? {
          role: c.messages[c.messages.length - 1].role,
          content: c.messages[c.messages.length - 1].content,
          createdAt: c.messages[c.messages.length - 1].createdAt,
        }
      : null,
  }));
}

export function getDemoInboxConversation(id: string) {
  seedIfNeeded();
  const g = getGlobalStore();
  return g.conversations.get(id) || null;
}

export function findOrCreateDemoInboxConversation(args: FindOrCreateArgs) {
  seedIfNeeded();
  const g = getGlobalStore();

  const {
    tenantId,
    conversationId,
    customerName,
    subject,
    channel,
    tags = [],
  } = args;

  if (conversationId && g.conversations.has(conversationId)) {
    return g.conversations.get(conversationId)!;
  }

  const id = conversationId || makeId("conv");
  const convo: DemoInboxConversation = {
    id,
    tenantId,
    customerName: customerName?.trim() || "Website visitor",
    subject: subject?.trim() || "Website chat",
    status: "open",
    channel: channel?.trim() || "web",
    aiEnabled: true,
    tags,
    archivedAt: null,
    needsHuman: false,
    unread: true,
    lastMessageAt: nowIso(),
    messages: [],
  };

  g.conversations.set(id, convo);
  return convo;
}

export function appendDemoInboxMessage(
  conversationId: string,
  role: DemoRole,
  content: string,
  products?: DemoInboxProduct[]
) {
  seedIfNeeded();
  const g = getGlobalStore();

  const convo = g.conversations.get(conversationId);
  if (!convo) return null;

    const msg: DemoInboxMessage = {
    id: makeId("msg"),
    role,
    content,
    createdAt: nowIso(),
    products: Array.isArray(products) && products.length ? products : undefined,
  };

  convo.messages.push(msg);
  convo.lastMessageAt = msg.createdAt;
  convo.unread = role === "customer" ? true : convo.unread;

  if (role === "customer") {
    convo.subject =
      convo.subject === "Website chat" ||
      convo.subject === "Starter Link" ||
      convo.subject === "Demo chat"
        ? content.slice(0, 80)
        : convo.subject;
  }

  return msg;
}

export function markDemoInboxSeen(conversationId: string) {
  seedIfNeeded();
  const g = getGlobalStore();

  const convo = g.conversations.get(conversationId);
  if (!convo) return null;

  convo.unread = false;
  return convo;
}