/**
 * Types du domaine WINE / Contravo, alignés sur `lib/api/types.ts` (snake_case API)
 * et extensions produit (devis, factures, pièces jointes scannées, etc.).
 */

import type {
  Activity,
  AnalyticsOverview,
  AnalyticsPipeline,
  ChatMessage,
  Client,
  OpportunityStage,
  Post,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  UserRef,
} from "@/lib/api/types";

export type {
  Activity,
  AnalyticsOverview,
  AnalyticsPipeline,
  ChatMessage,
  Client,
  OpportunityStage,
  Post,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  UserRef,
};

export type PaymentChannel = "mtn_momo" | "moov" | "celtiis" | "bank_transfer";

export type AttachmentStatus = "pending" | "scanning" | "clean" | "ready" | "infected";

/** Fichier Contravo après téléversement (statut antivirus). */
export type Attachment = {
  id: string;
  organization_id: number;
  name: string;
  mime: string;
  size: number;
  status: AttachmentStatus;
  project_id: number | null;
  client_id: number | null;
  uploaded_by: number;
  uploaded_at: string;
  scan_finished_at: string | null;
  scan_message: string | null;
};

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export type Quote = {
  id: string;
  organization_id: number;
  number: string;
  client_id: number;
  project_id: number | null;
  title: string;
  amount_xof: number;
  status: QuoteStatus;
  valid_until: string | null;
  payment_channels: PaymentChannel[];
  created_at: string;
  sent_at: string | null;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export type Invoice = {
  id: string;
  organization_id: number;
  number: string;
  client_id: number;
  project_id: number | null;
  quote_id: string | null;
  title: string;
  amount_xof: number;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  payment_channel: PaymentChannel | null;
  created_at: string;
};

export type ContractStatus = "draft" | "pending_signature" | "active" | "expired" | "terminated";

export type Contract = {
  id: string;
  organization_id: number;
  number: string;
  client_id: number;
  project_id: number | null;
  title: string;
  status: ContractStatus;
  amount_xof: number | null;
  signed_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export type ConversationMessage = {
  id: string;
  author: "client" | "team";
  body: string;
  sent_at: string;
};

export type Conversation = {
  id: string;
  organization_id: number;
  client_id: number;
  subject: string;
  quote_id: string | null;
  status: "open" | "closed";
  updated_at: string;
  messages: ConversationMessage[];
};

export type DeliverableStatus = "pending" | "submitted" | "approved" | "rejected";

export type Deliverable = {
  id: string;
  project_id: number;
  title: string;
  due_date: string | null;
  status: DeliverableStatus;
  attachment_ids: string[];
};

export type Review = {
  id: string;
  project_id: number;
  client_id: number;
  rating: number;
  comment: string | null;
  author_name: string;
  created_at: string;
};

export type NotificationKind =
  | "task_assigned"
  | "task_due"
  | "chat_message"
  | "quote_sent"
  | "quote_accepted"
  | "invoice_sent"
  | "invoice_paid"
  | "invoice_overdue"
  | "contract_signed"
  | "file_ready"
  | "file_infected"
  | "deliverable_submitted"
  | "mention";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  href: string | null;
  created_at: string;
  meta?: Record<string, unknown>;
};

export type SearchHitProject = { id: number; name: string; status: ProjectStatus; client_name: string | null };
export type SearchHitTask = { id: number; title: string; status: TaskStatus; project_id: number; project_name: string };
export type SearchHitClient = { id: number; name: string; company: string | null; city: string | null };
export type SearchHitQuote = { id: string; number: string; title: string; amount_xof: number };

export type SearchResults = {
  query: string;
  projects: SearchHitProject[];
  tasks: SearchHitTask[];
  clients: SearchHitClient[];
  quotes: SearchHitQuote[];
};

export type AiSummaryScope = "project" | "client" | "pipeline";

export type AiSummary = {
  scope: AiSummaryScope;
  scope_id: string | number;
  summary: string;
  bullets: string[];
  generated_at: string;
};

export type StatsActivityItem = Activity & {
  project_id?: number | null;
  client_id?: number | null;
};

export type ProfitabilityRow = {
  project_id: number;
  project_name: string;
  client_name: string;
  revenue_xof: number;
  cost_xof: number;
  margin_pct: number;
};

export type StatsOverview = AnalyticsOverview & {
  open_quotes_xof: number;
  unpaid_invoices_xof: number;
  signed_contracts: number;
};
