/**
 * Types des réponses de l'API Laravel (`/api/v1`). Les champs restent en
 * snake_case, tels que sérialisés par Eloquent. Les dates sont des chaînes ISO.
 */

export type Role = "owner" | "admin" | "manager" | "member" | "guest";
export type ProjectStatus = "upcoming" | "in_progress" | "on_hold" | "done";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type OpportunityStage = "prospect" | "contacted" | "proposal" | "won" | "lost";

export type Paginated<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
};

export type User = {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  current_organization_id: number | null;
  created_at: string;
  /** Extensions (cf. docs/api-gaps.md). */
  title?: string | null;
  phone?: string | null;
};

export type NotificationPrefs = { task_assigned: boolean; due_reminder: boolean; chat_messages: boolean; weekly_digest: boolean };

export type UserRef = { id: number; name: string; avatar?: string | null };

export type Organization = {
  id: number;
  name: string;
  slug: string;
  owner_id: number;
  plan: string | null;
  members_count?: number;
  pivot?: { role: Role };
};

export type Me = {
  user: User;
  organizations: Organization[];
  current_organization: Organization | null;
};

export type Member = {
  user_id: number;
  name: string;
  email: string;
  avatar: string | null;
  role: Role;
  title?: string | null;
  /** Extensions (cf. docs/api-gaps.md) — absentes sur une API non mise à jour. */
  joined_at?: string | null;
  last_active_at?: string | null;
};

export type Invitation = {
  id: number;
  organization_id: number;
  email: string;
  role: Role;
  token: string;
  expires_at: string;
  created_at: string;
};

export type InvitationPreview = {
  email: string;
  role: Role;
  expires_at: string;
  organization: { id: number; name: string };
  invited_by: { id: number; name: string } | null;
};

export type Project = {
  id: number;
  organization_id: number;
  owner_id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  archived_at: string | null;
  created_at: string;
  owner?: UserRef;
  members?: (UserRef & { email?: string })[];
  tasks_count?: number;
  done_tasks_count?: number;
  client?: { id: number; name: string; company: string | null } | null;
  /** Extensions (cf. docs/api-gaps.md). */
  milestones?: { code: string; title: string; done: boolean; current: boolean }[];
  attachments?: { id: number; kind: string; name: string; size: string }[];
  contravo_invoice_id?: string | null;
  contravo_contract_id?: string | null;
};

export type Task = {
  id: number;
  organization_id: number;
  project_id: number;
  parent_id: number | null;
  assignee_id: number | null;
  created_by: number | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  position: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee?: UserRef | null;
  creator?: UserRef | null;
  project?: { id: number; name: string };
  subtasks?: Task[];
  comments?: TaskComment[];
  subtasks_count?: number;
  done_subtasks_count?: number;
  comments_count?: number;
  /** Extension (cf. docs/api-gaps.md). */
  attachments?: { id: number; kind: string; name: string; size: string }[];
};

export type TaskComment = {
  id: number;
  task_id: number;
  user_id: number;
  body: string;
  created_at: string;
  author?: UserRef;
};

export type Client = {
  id: number;
  organization_id: number;
  owner_id: number | null;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address?: string | null;
  notes: string | null;
  created_at: string;
  owner?: UserRef | null;
  opportunities?: Opportunity[];
  /** Extension Contravo (Laravel). */
  contravo_client_id?: string | null;
};

export type Opportunity = {
  id: number;
  organization_id: number;
  client_id: number;
  owner_id: number | null;
  project_id: number | null;
  title: string;
  amount: string | null;
  stage: OpportunityStage;
  next_follow_up: string | null;
  notes: string | null;
  closed_at: string | null;
  created_at: string;
  client?: { id: number; name: string; company: string | null };
  owner?: UserRef | null;
  project?: { id: number; name: string } | null;
  contravo_quote_id?: string | null;
};

export type ActivityKind = "note" | "call" | "email" | "meeting";

export type Activity = {
  id: number;
  action: string;
  user?: UserRef | null;
  meta?: Record<string, unknown> | null;
  body?: string | null;
  kind?: ActivityKind | null;
  created_at: string;
};

export type Post = {
  id: number;
  organization_id: number;
  author_id: number;
  body: string;
  pinned: boolean;
  pinned_at: string | null;
  created_at: string;
  author?: UserRef & { role?: Role };
  reactions_count?: number;
  comments_count?: number;
  reacted?: boolean;
  /** Extensions (cf. docs/api-gaps.md) : publication typée (« projet livré »…). */
  kind?: "project_delivered" | "milestone" | null;
  meta?: { project?: string } | null;
  comments?: PostComment[];
  reactions?: { id: number; user_id: number; emoji: string }[];
};

export type PostComment = {
  id: number;
  post_id: number;
  author_id: number;
  body: string;
  created_at: string;
  author?: UserRef;
};

export type AnalyticsOverview = {
  active_projects: number;
  overdue_tasks: number;
  workload: { user_id: number; name: string; open_tasks: number }[];
  /** Extensions (cf. docs/api-gaps.md). */
  completed_per_week?: { week: string; count: number }[];
  late_projects?: { id: number; name: string; overdue: number }[];
  completed_tasks?: number;
};

export type AnalyticsPipeline = {
  by_stage: { stage: OpportunityStage; count: number; amount: number }[];
};

export type Channel = {
  id: string;
  type: "project" | "direct";
  name: string;
  project_id: number | null;
  member_ids: number[];
  unread_count?: number;
  last_message_at?: string | null;
};

export type ChatMessage = {
  _id: string;
  channel_id: string;
  sender_id: number;
  body: string;
  attachments: { path: string; name: string; mime: string; size: number }[];
  read_by: { user_id: number; at: string }[];
  created_at: string;
};
