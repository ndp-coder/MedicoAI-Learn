import type { Msg } from "@/lib/stream";

export interface ChatConversation {
  id: string;
  title: string;
  messages: Msg[];
  createdAt: string;
  updatedAt: string;
}

export function createChat(): ChatConversation {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function generateTitle(firstMessage: string): string {
  const cleaned = firstMessage.trim().replace(/\n/g, " ");
  return cleaned.length > 40 ? cleaned.slice(0, 40) + "…" : cleaned;
}

export function filterChats(
  chats: ChatConversation[],
  query: string
): ChatConversation[] {
  if (!query.trim()) return chats;
  const q = query.toLowerCase();
  return chats.filter((c) => c.title.toLowerCase().includes(q));
}
