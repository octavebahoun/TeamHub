import type { Review } from "@/lib/data/types";

export const mockReviews: Review[] = [
  {
    id: "rev-1",
    project_id: 205,
    client_id: 105,
    rating: 5,
    comment: "Équipe réactive, résultats au-delà des objectifs sur Cotonou et Porto-Novo.",
    author_name: "Chantal Zinsou",
    created_at: "2026-09-05T14:00:00Z",
  },
  {
    id: "rev-2",
    project_id: 201,
    client_id: 101,
    rating: 4,
    comment: "Bonne communication ; intégration MoMo bien expliquée.",
    author_name: "Adjoa Kouassi",
    created_at: "2026-09-25T10:30:00Z",
  },
  {
    id: "rev-3",
    project_id: 204,
    client_id: 104,
    rating: 5,
    comment: "Tableau de bord clair pour nos équipes à Dakar.",
    author_name: "Moussa Ndiaye",
    created_at: "2026-08-20T09:00:00Z",
  },
];
