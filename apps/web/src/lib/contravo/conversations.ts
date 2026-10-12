import { contravoFetch, useContravoMocks, useLocalBilling } from "./client";
import * as ledger from "./ledger";
import { mocks } from "./mocks";
import { ContravoError, type ConversationSummary, type ConversationThread } from "./types";

export async function listConversations(query: { clientId?: string } = {}): Promise<ConversationSummary[]> {
  if (useContravoMocks()) return mocks.listConversations(query);
  if (await useLocalBilling()) return ledger.listConversations(query.clientId);
  const res = await contravoFetch<{ conversations: ConversationSummary[] }>("/conversations", { query });
  return res.conversations;
}

export async function openConversation(clientId: string, channel: "whatsapp" | "telegram"): Promise<ConversationThread> {
  if (await useLocalBilling()) return ledger.openConversation(clientId, channel);
  throw new ContravoError(422, "Ouvrez la conversation depuis Contravo.");
}

export async function getConversation(id: string): Promise<ConversationThread> {
  if (await useLocalBilling()) return ledger.getConversation(id);
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
  if (await useLocalBilling()) return ledger.sendConversationMessage(id, text);
  if (useContravoMocks()) return mocks.sendMessage(id, text);
  return contravoFetch<{ message: ConversationThread["messages"][0]; iaActive: boolean }>(
    `/conversations/${encodeURIComponent(id)}/messages`,
    { method: "POST", body: { text } }
  );
}
