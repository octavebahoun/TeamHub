import type { Contract } from "@/lib/data/types";
import { MOCK_ORG_ID } from "./clients";

export const mockContracts: Contract[] = [
  {
    id: "ctr-101",
    organization_id: MOCK_ORG_ID,
    number: "CTR-2026-003",
    client_id: 101,
    project_id: 201,
    title: "Contrat de prestation — refonte e-commerce",
    status: "active",
    amount_xof: 4_850_000,
    signed_at: "2026-09-20T10:00:00Z",
    expires_at: "2027-09-20",
    created_at: "2026-09-01T09:00:00Z",
  },
  {
    id: "ctr-102",
    organization_id: MOCK_ORG_ID,
    number: "CTR-2026-005",
    client_id: 102,
    project_id: 202,
    title: "Marché public — portail Porto-Novo",
    status: "pending_signature",
    amount_xof: 6_200_000,
    signed_at: null,
    expires_at: "2027-06-30",
    created_at: "2026-09-22T15:00:00Z",
  },
  {
    id: "ctr-105",
    organization_id: MOCK_ORG_ID,
    number: "CTR-2026-001",
    client_id: 105,
    project_id: 205,
    title: "Contrat cadre marketing Celtiis Bénin",
    status: "active",
    amount_xof: 2_150_000,
    signed_at: "2026-09-01T12:00:00Z",
    expires_at: "2027-08-31",
    created_at: "2026-08-10T08:00:00Z",
  },
];
