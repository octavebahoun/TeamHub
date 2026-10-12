import type { Conversation } from "@/lib/data/types";
import { MOCK_ORG_ID } from "./clients";

export const mockConversations: Conversation[] = [
  {
    id: "conv-101",
    organization_id: MOCK_ORG_ID,
    client_id: 101,
    subject: "Validation maquettes checkout MoMo",
    quote_id: "q-101",
    status: "open",
    updated_at: "2026-09-30T16:00:00Z",
    messages: [
      {
        id: "cm-1",
        author: "client",
        body: "Bonjour, pouvez-vous ajouter le logo MoMo sur l'écran de confirmation ?",
        sent_at: "2026-09-29T11:00:00Z",
      },
      {
        id: "cm-2",
        author: "team",
        body: "Bien reçu Adjoa — mise à jour prévue demain matin.",
        sent_at: "2026-09-29T14:30:00Z",
      },
      {
        id: "cm-3",
        author: "client",
        body: "Parfait, merci !",
        sent_at: "2026-09-30T16:00:00Z",
      },
    ],
  },
  {
    id: "conv-102",
    organization_id: MOCK_ORG_ID,
    client_id: 102,
    subject: "Planning atelier mairie",
    quote_id: "q-102",
    status: "open",
    updated_at: "2026-10-01T08:30:00Z",
    messages: [
      {
        id: "cm-4",
        author: "team",
        body: "Romuald, je vous envoie l'ordre du jour pour jeudi.",
        sent_at: "2026-10-01T08:30:00Z",
      },
    ],
  },
  {
    id: "conv-103",
    organization_id: MOCK_ORG_ID,
    client_id: 103,
    subject: "Devis MVP logistique",
    quote_id: "q-103",
    status: "closed",
    updated_at: "2026-09-27T17:00:00Z",
    messages: [
      {
        id: "cm-5",
        author: "client",
        body: "Nous revoyons le périmètre avec la direction — retour la semaine prochaine.",
        sent_at: "2026-09-27T17:00:00Z",
      },
    ],
  },
];
