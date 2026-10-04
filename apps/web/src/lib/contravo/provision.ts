import { userFacingError } from "@/lib/errors/user-facing";
import type { CreateContravoClient, CreateContravoProject, CreateContract } from "./types";

export type WineClientInput = {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

export type ContravoClientPayload = { ok: true; body: CreateContravoClient } | { ok: false; error: string };

const PROJECT_STATUS: Record<string, CreateContravoProject["status"]> = {
  upcoming: "draft",
  in_progress: "active",
  on_hold: "on_hold",
  done: "delivered",
};

function day(value?: string | null): string | undefined {
  if (!value) return undefined;
  const cut = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(cut) ? cut : undefined;
}

/** Fiche client Contravo. L'email est obligatoire chez Contravo. */
export function contravoClientPayload(input: WineClientInput): ContravoClientPayload {
  const email = input.email?.trim() ?? "";
  if (!email) return { ok: false, error: "Ajoutez un email à ce client pour le relier à la facturation." };

  const company = input.company?.trim() ?? "";
  const name = input.name.trim();
  const phone = input.phone?.trim() || undefined;
  const contact = company && name ? `Contact : ${name}` : "";
  const notes = [input.notes?.trim(), contact].filter(Boolean).join("\n") || undefined;

  if (company) {
    return { ok: true, body: { type: "company", displayName: company, companyName: company, email, phone, notes } };
  }

  return { ok: true, body: { type: "individual", displayName: name || email, email, phone, notes } };
}

export function contravoProjectPayload(input: {
  clientId: string;
  name: string;
  description?: string | null;
  status?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
}): CreateContravoProject {
  const description = input.description?.trim() || undefined;
  return {
    clientId: input.clientId,
    name: input.name.trim(),
    description,
    status: PROJECT_STATUS[input.status ?? ""] ?? "active",
    startDate: day(input.startDate),
    dueDate: day(input.dueDate),
    currency: "XOF",
  };
}

export function contravoContractPayload(input: {
  projectId: string;
  clientId: string;
  projectName: string;
  title?: string | null;
  quoteId?: string | null;
}): CreateContract {
  const title = input.title?.trim() || `Contrat — ${input.projectName}`;
  return {
    projectId: input.projectId,
    clientId: input.clientId,
    title,
    quoteId: input.quoteId || undefined,
    bodyMarkdown: `Contrat pour le projet « ${input.projectName} ».`,
  };
}

export function billingError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "La facturation a échoué.";
  const message = raw.replace(/^Contravo \d+: /, "");
  if (message.includes("contracts:")) return "La clé de facturation n'autorise pas les contrats.";
  if (message.includes("clients:")) return "La clé de facturation n'autorise pas la création de clients.";
  if (message.includes("projects:")) return "La clé de facturation n'autorise pas la création de projets.";
  if (message.includes("quotes:")) return "La clé de facturation n'autorise pas les devis.";
  return userFacingError(message);
}
