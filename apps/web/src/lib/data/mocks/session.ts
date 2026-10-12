import type { Me, Member, Organization, User } from "@/lib/api/types";
import { MOCK_ORG_ID } from "./clients";

export const MOCK_TOKEN_PREFIX = "mock.";

export const mockUser: User = {
  id: 1,
  name: "Amina Traoré",
  email: "amina@excellence.bj",
  avatar: null,
  current_organization_id: MOCK_ORG_ID,
  created_at: "2026-01-10T09:00:00Z",
  title: "Lead Frontend",
  phone: "+229 97 00 11 22",
};

export const mockOrganization: Organization = {
  id: MOCK_ORG_ID,
  name: "Excellence Team Cotonou",
  slug: "excellence-cotonou",
  owner_id: 1,
  plan: "pro",
  members_count: 4,
  pivot: { role: "owner" },
};

export const mockMe: Me = {
  user: mockUser,
  organizations: [mockOrganization],
  current_organization: mockOrganization,
};

export const mockMembers: Member[] = [
  {
    user_id: 1,
    name: "Amina Traoré",
    email: "amina@excellence.bj",
    avatar: null,
    role: "owner",
    title: "Lead Frontend",
    joined_at: "2026-01-10T09:00:00Z",
  },
  {
    user_id: 2,
    name: "Koffi Mensah",
    email: "koffi@excellence.bj",
    avatar: null,
    role: "manager",
    title: "Chef de projet",
    joined_at: "2026-02-01T09:00:00Z",
  },
  {
    user_id: 3,
    name: "Fatou Diop",
    email: "fatou@excellence.bj",
    avatar: null,
    role: "member",
    title: "Développeuse",
    joined_at: "2026-03-15T09:00:00Z",
  },
  {
    user_id: 4,
    name: "Jean-Baptiste Okou",
    email: "jb@excellence.bj",
    avatar: null,
    role: "admin",
    title: "Realtime / DevOps",
    joined_at: "2026-01-20T09:00:00Z",
  },
];

export function isMockToken(token: string | undefined | null): boolean {
  return !!token && token.startsWith(MOCK_TOKEN_PREFIX);
}

export function makeMockToken(email: string): string {
  const encoded = typeof Buffer !== "undefined" ? Buffer.from(email).toString("base64url") : btoa(email).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${MOCK_TOKEN_PREFIX}${encoded}`;
}
