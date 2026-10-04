/** Types Contravo API v1 (camelCase, montants en centimes XOF en chaîne). */

export type MoneyString = string;

export type QuoteStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected" | "cancelled" | "expired";
export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled" | "refunded";
export type ContractStatus = "draft" | "sent" | "signed" | "cancelled" | "expired";
export type DeliverableStatus = "draft" | "submitted" | "approved" | "rejected" | "revision_requested";
export type FileStatus = "uploading" | "scanning" | "clean" | "infected" | "ready" | "failed";
export type ConversationChannel = "whatsapp" | "telegram";
export type MessageSender = "client" | "ia" | "freelance";
export type PaymentMethod = "bank_transfer" | "mobile_money" | "card" | "cash" | "check" | "other";

export type LineItemInput = {
  description: string;
  quantity: string;
  unit?: string;
  unitPriceCents: MoneyString | number;
  discountBps?: number;
  position?: number;
};

export type QuoteLineItemInput = LineItemInput & { netUnitPriceCents?: MoneyString | number };

export type QuoteLineItem = QuoteLineItemInput & {
  id: string;
  totalCents: MoneyString;
};

export type Quote = {
  id: string;
  organizationId: string;
  projectId: string;
  clientId: string;
  number: string;
  status: QuoteStatus;
  currency: string;
  subtotalCents: MoneyString;
  discountCents: MoneyString;
  taxRateBps: number;
  taxCents: MoneyString;
  totalCents: MoneyString;
  validUntil: string;
  notes: string | null;
  terms: string | null;
  pdfFileId: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  acceptedByName: string | null;
  acceptedByEmail: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  pricingMode: "net" | "gross" | null;
  desiredNetCents: MoneyString | null;
  createdAt: string;
  updatedAt: string;
  items?: QuoteLineItem[];
};

export type CreateQuote = {
  projectId: string;
  clientId: string;
  validUntil: string;
  items: QuoteLineItemInput[];
  currency?: string;
  discountCents?: MoneyString | number;
  taxRateBps?: number;
  notes?: string | null;
  terms?: string | null;
  status?: QuoteStatus;
  pricingMode?: "net" | "gross";
};

export type QuoteTransition = { action: "send" | "view" | "accept" | "reject" | "cancel" | "expire"; reason?: string };

export type Invoice = {
  id: string;
  organizationId: string;
  projectId: string | null;
  clientId: string;
  contractId: string | null;
  number: string;
  status: InvoiceStatus;
  currency: string;
  subtotalCents: MoneyString;
  discountCents: MoneyString;
  taxRateBps: number;
  taxCents: MoneyString;
  totalCents: MoneyString;
  amountPaidCents: MoneyString;
  amountDueCents: MoneyString;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  pdfFileId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: QuoteLineItem[];
};

export type InvoiceTransition = { action: "send" | "cancel" | "refund" | "mark_overdue" };

export type RecordPayment = {
  amountCents: MoneyString | number;
  method: PaymentMethod;
  reference?: string | null;
  paidAt?: string;
};

export type Payment = {
  id: string;
  invoiceId: string;
  amountCents: MoneyString;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string;
  createdAt: string;
};

export type Contract = {
  id: string;
  organizationId: string;
  projectId: string;
  clientId: string;
  quoteId: string | null;
  number: string;
  title: string;
  status: ContractStatus;
  bodyMarkdown: string | null;
  pdfFileId: string | null;
  signedPdfFileId: string | null;
  sentAt: string | null;
  signedAt: string | null;
  signedByName: string | null;
  signedByEmail: string | null;
  signatureHash: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateContravoClient = {
  type: "individual" | "company";
  displayName: string;
  companyName?: string;
  email: string;
  phone?: string;
  notes?: string;
};

export type ContravoClient = {
  id: string;
  organizationId: string;
  type: "individual" | "company";
  displayName: string;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  vatNumber: string | null;
  notes: string | null;
  tags: string[];
  isArchived: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationSummary = {
  id: string;
  channel: ConversationChannel;
  displayName: string;
  identifierLabel: string;
  iaActive: boolean;
  lastMessageAt: string | null;
  lastMessage: { sender: MessageSender; preview: string } | null;
  quote: { id: string; number: string; status: QuoteStatus } | null;
};

export type ConversationMessage = {
  id: string;
  sender: MessageSender;
  content: string;
  deliveryStatus: "sent" | "failed" | null;
  createdAt: string;
};

export type ConversationThread = Omit<ConversationSummary, "quote"> & {
  messages: ConversationMessage[];
  collected: { need: string | null; budget: string | null; notes: string | null };
  quote: ({ id: string; number: string; status: QuoteStatus; totalCents?: MoneyString; currency?: string } | null);
};

export type ContravoFile = {
  id: string;
  organizationId: string;
  filename: string;
  mimeType: string;
  sizeBytes: string;
  sha256: string | null;
  kind: string;
  status: FileStatus;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  uploadedVia: "web" | "api";
  createdAt: string;
};

export type PresignUploadInput = {
  kind: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  linkedEntityType?: "quote" | "contract" | "invoice" | null;
  linkedEntityId?: string | null;
};

export type PresignUploadResult = {
  fileId: string;
  uploadUrl: string;
  r2Key: string;
  requiredHeaders: { "content-type": string; "content-length": string };
};

export type FileDownload = { url: string; expiresAt: string };

export type Deliverable = {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: DeliverableStatus;
  fileId: string | null;
  fileName: string | null;
  fileSizeBytes: string | null;
  fileMime: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedByName: string | null;
  reviewedByEmail: string | null;
  rejectionReason: string | null;
  version: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Review = {
  id: string;
  organizationId: string;
  requestId: string;
  projectId: string;
  clientId: string;
  rating: number;
  comment: string | null;
  submittedAt: string;
  submittedByName: string;
  submittedByEmail: string | null;
  isPublic: boolean;
  moderationStatus: string;
};

export type SignatureVerification = {
  valid: boolean;
  signedAt: string | null;
  signerName: string | null;
  documentNumber: string | null;
  signatureHash: string | null;
};

export type CreateContravoProject = {
  clientId: string;
  name: string;
  description?: string;
  status?: "draft" | "active" | "on_hold" | "delivered" | "cancelled" | "archived";
  startDate?: string;
  dueDate?: string;
  currency?: string;
};

export type CreateContract = {
  projectId: string;
  clientId: string;
  quoteId?: string;
  title: string;
  bodyMarkdown?: string;
};

export type ContravoProject = {
  id: string;
  organizationId: string;
  clientId: string;
  code: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "on_hold" | "delivered" | "cancelled" | "archived";
  startDate: string | null;
  dueDate: string | null;
  deliveredAt: string | null;
  budgetCents: MoneyString | null;
  currency: string;
  plannedDeliverables: number | null;
  ownerUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListQuery = {
  page?: number;
  limit?: number;
  projectId?: string;
  clientId?: string;
  status?: string;
};

export class ContravoError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(`Contravo ${status}: ${message}`);
    this.name = "ContravoError";
  }
}
