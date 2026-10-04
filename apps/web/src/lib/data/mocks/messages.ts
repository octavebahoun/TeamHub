import type { ChatMessage } from "@/lib/data/types";

export const mockMessages: ChatMessage[] = [
  {
    _id: "msg-1",
    channel_id: "project-201",
    sender_id: 2,
    body: "Le retour MoMo sandbox est OK — on peut tester le flux complet demain.",
    attachments: [],
    read_by: [{ user_id: 1, at: "2026-09-30T10:05:00Z" }, { user_id: 3, at: "2026-09-30T10:12:00Z" }],
    created_at: "2026-09-30T10:00:00Z",
  },
  {
    _id: "msg-2",
    channel_id: "project-201",
    sender_id: 3,
    body: "Parfait. J'ajoute les libellés en français pour les erreurs de paiement.",
    attachments: [],
    read_by: [{ user_id: 2, at: "2026-09-30T10:20:00Z" }],
    created_at: "2026-09-30T10:15:00Z",
  },
  {
    _id: "msg-3",
    channel_id: "project-202",
    sender_id: 1,
    body: "Romuald confirme la réunion mairie jeudi à Porto-Novo.",
    attachments: [{ path: "/mock/ordre-du-jour.pdf", name: "ordre-du-jour.pdf", mime: "application/pdf", size: 245_760 }],
    read_by: [],
    created_at: "2026-10-01T08:30:00Z",
  },
  {
    _id: "msg-4",
    channel_id: "direct-1-3",
    sender_id: 1,
    body: "Tu peux relancer Esi sur le devis Lomé Hub ?",
    attachments: [],
    read_by: [{ user_id: 3, at: "2026-10-01T09:00:00Z" }],
    created_at: "2026-10-01T08:45:00Z",
  },
];
