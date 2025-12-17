export type ConversationStatus = 'open' | 'waiting' | 'closed';
export type Channel = 'Web' | 'Shopify' | 'Email';

export type MessageRole = 'customer' | 'assistant' | 'agent' | 'note';

export type Message = {
  id: string;
  role: MessageRole;
  text: string;
  ts: number; // epoch ms
};

export type Conversation = {
  id: string;
  customer: string;
  subject: string;
  status: ConversationStatus;
  channel: Channel;
  tags: string[];
  updatedAt: number;
  messages: Message[];

  // If undefined: follow global AI auto-reply toggle
  // If false/true: override AI for this conversation only
  aiEnabled?: boolean;
};
