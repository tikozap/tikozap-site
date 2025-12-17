import type { Conversation } from './types';

const now = Date.now();

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    customer: 'Mia · Order #1043',
    subject: 'Return policy question',
    status: 'open',
    channel: 'Web',
    tags: ['returns'],
    updatedAt: now - 1000 * 60 * 12,
    messages: [
      { id: 'm1', role: 'customer', text: 'Hi! What is your return policy?', ts: now - 1000 * 60 * 12 },
      { id: 'm2', role: 'assistant', text: 'We accept returns within 30 days as long as items are unworn and with tags. Would you like the steps to start a return?', ts: now - 1000 * 60 * 11 },
    ],
  },
  {
    id: 'c2',
    customer: 'Sophia',
    subject: 'Shipping time',
    status: 'waiting',
    channel: 'Web',
    tags: ['shipping'],
    updatedAt: now - 1000 * 60 * 45,
    messages: [
      { id: 'm1', role: 'customer', text: 'How many days does shipping take?', ts: now - 1000 * 60 * 45 },
      { id: 'm2', role: 'assistant', text: 'Orders usually ship in 1–2 business days and arrive in about 3–7 business days (US). What’s your ZIP code?', ts: now - 1000 * 60 * 44 },
    ],
  },
  {
    id: 'c3',
    customer: 'Emma · Order #1099',
    subject: 'Where is my order?',
    status: 'open',
    channel: 'Email',
    tags: ['order-status'],
    updatedAt: now - 1000 * 60 * 90,
    messages: [
      { id: 'm1', role: 'customer', text: 'Where is my order? I placed it last week.', ts: now - 1000 * 60 * 90 },
      { id: 'm2', role: 'assistant', text: 'I can help. Please share your order number and the email used at checkout, and I’ll check the status.', ts: now - 1000 * 60 * 89 },
    ],
  },
];
