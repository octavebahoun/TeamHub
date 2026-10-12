import { contravoFetch, useContravoMocks } from "./client";
import { mocks } from "./mocks";
import { ContravoError, type ConversationSummary, type ConversationThread } from "./types";

export async function listConversations(query: { clientId?: string } = {}): Promise<ConversationSummary[]> {
  if (useContravoMocks()) return mocks.listConversations(query);
  const res = await contravoFetch<{ conversations: ConversationSummary[] }>("/conversations", { query });
  return res.conversations;
}

export async function getConversation(id: string): Promise<ConversationThread> {
  if (useContravoMocks()) {
    try {
      return mocks.getConversation(id);
    } catch {
      throw new ContravoError(404, "Conversation introuvable.");
    }
  }
  return contravoFetch<ConversationThread>(`/conversations/${encodeURIComponent(id)}`);
}

export async function sendConversationMessage(id: string, text: string) {
  if (useContravoMocks()) return mocks.sendMessage(id, text);
  return contravoFetch<{ message: ConversationThread["messages"][0]; iaActive: boolean }>(
    `/conversations/${encodeURIComponent(id)}/messages`,
    { method: "POST", body: { text } }
  );
}
