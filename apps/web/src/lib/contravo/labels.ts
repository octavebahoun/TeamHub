import type { ContractStatus, InvoiceStatus, QuoteStatus } from "./types";
import type { Tone } from "@/lib/labels";

export const QUOTE_STATUS: Record<QuoteStatus, { label: string; tone: Tone }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  sent: { label: "Envoyé", tone: "info" },
  viewed: { label: "Consulté", tone: "info" },
  accepted: { label: "Accepté", tone: "success" },
  rejected: { label: "Refusé", tone: "danger" },
  cancelled: { label: "Annulé", tone: "neutral" },
  expired: { label: "Expiré", tone: "neutral" },
};

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  sent: { label: "Envoyée", tone: "info" },
  partial: { label: "Partiel", tone: "brand" },
  paid: { label: "Payée", tone: "success" },
  overdue: { label: "En retard", tone: "danger" },
  cancelled: { label: "Annulée", tone: "neutral" },
  refunded: { label: "Remboursée", tone: "neutral" },
};

export const CONTRACT_STATUS: Record<ContractStatus, { label: string; tone: Tone }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  sent: { label: "Envoyé", tone: "info" },
  signed: { label: "Signé", tone: "success" },
  cancelled: { label: "Annulé", tone: "neutral" },
  expired: { label: "Expiré", tone: "neutral" },
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  mobile_money: "Mobile Money (MoMo)",
  bank_transfer: "Virement",
  card: "Carte",
  cash: "Espèces",
  check: "Chèque",
  other: "Autre",
};
