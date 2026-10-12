import type {
  Contract,
  ContravoClient,
  ContravoFile,
  ContravoProject,
  ConversationMessage,
  ConversationSummary,
  ConversationThread,
  CreateQuote,
  Deliverable,
  FileDownload,
  Invoice,
  ListQuery,
  Payment,
  PresignUploadInput,
  PresignUploadResult,
  Quote,
  QuoteTransition,
  RecordPayment,
  Review,
  SignatureVerification,
} from "./types";

const ORG = "org-mock-wa-001";
const CLIENT = "cli-amadou-djallo";
const PROJECT = "prj-site-vitrine-dakar";
const now = () => new Date().toISOString();

let quoteSeq = 42;
let invoiceSeq = 18;

function xof(n: number): string {
  return String(Math.max(0, Math.round(n)));
}

function calcTotals(items: CreateQuote["items"], discountCents: number, taxRateBps: number) {
  const subtotal = items.reduce((s, it) => {
    const q = Number(it.quantity) || 1;
    const unit = Number(it.unitPriceCents) || 0;
    const lineDisc = it.discountBps ? Math.round((unit * q * it.discountBps) / 10000) : 0;
    return s + Math.round(unit * q) - lineDisc;
  }, 0);
  const afterDisc = Math.max(0, subtotal - discountCents);
  const tax = Math.round((afterDisc * taxRateBps) / 10000);
  return { subtotalCents: xof(subtotal), discountCents: xof(discountCents), taxCents: xof(tax), totalCents: xof(afterDisc + tax) };
}

const mockQuotes: Quote[] = [
  {
    id: "q-mock-101",
    organizationId: ORG,
    projectId: PROJECT,
    clientId: CLIENT,
    number: "DEV-2026-0042",
    status: "sent",
    currency: "XOF",
    subtotalCents: "2500000",
    discountCents: "0",
    taxRateBps: 1800,
    taxCents: "450000",
    totalCents: "2950000",
    validUntil: "2026-11-30",
    notes: "Validité 30 jours · Paiement 40 % à la commande.",
    terms: null,
    pdfFileId: "file-mock-pdf-q101",
    sentAt: now(),
    viewedAt: null,
    acceptedAt: null,
    acceptedByName: null,
    acceptedByEmail: null,
    rejectedAt: null,
    rejectionReason: null,
    pricingMode: "gross",
    desiredNetCents: null,
    createdAt: now(),
    updatedAt: now(),
    items: [
      { id: "li-1", description: "Maquettes UI (6 écrans)", quantity: "1", unit: "forfait", unitPriceCents: "1200000", totalCents: "1200000" },
      { id: "li-2", description: "Intégration Next.js", quantity: "8", unit: "jour", unitPriceCents: "162500", totalCents: "1300000" },
    ],
  },
];

const mockInvoices: Invoice[] = [
  {
    id: "inv-mock-201",
    organizationId: ORG,
    projectId: PROJECT,
    clientId: CLIENT,
    contractId: "ctr-mock-301",
    number: "FAC-2026-0018",
    status: "partial",
    currency: "XOF",
    subtotalCents: "1180000",
    discountCents: "0",
    taxRateBps: 1800,
    taxCents: "212400",
    totalCents: "1392400",
    amountPaidCents: "600000",
    amountDueCents: "792400",
    issueDate: "2026-09-15",
    dueDate: "2026-10-15",
    paidAt: null,
    pdfFileId: "file-mock-inv",
    notes: "Acompte attendu via Mobile Money.",
    createdAt: now(),
    updatedAt: now(),
  },
];

const mockContracts: Contract[] = [
  {
    id: "ctr-mock-301",
    organizationId: ORG,
    projectId: PROJECT,
    clientId: CLIENT,
    quoteId: "q-mock-101",
    number: "CTR-2026-0009",
    title: "Contrat de prestation — Site vitrine",
    status: "signed",
    bodyMarkdown: null,
    pdfFileId: "file-mock-ctr",
    signedPdfFileId: "file-mock-ctr-signed",
    sentAt: now(),
    signedAt: now(),
    signedByName: "Amadou Diallo",
    signedByEmail: "amadou@example.sn",
    signatureHash: "sha256-mock-ab12",
    expiresAt: "2027-01-01",
    createdAt: now(),
    updatedAt: now(),
  },
];

const mockClient: ContravoClient = {
  id: CLIENT,
  organizationId: ORG,
  type: "company",
  displayName: "Diallo & Fils SARL",
  companyName: "Diallo & Fils SARL",
  firstName: "Amadou",
  lastName: "Diallo",
  email: "amadou@example.sn",
  phone: "+221 77 123 45 67",
  vatNumber: null,
  notes: "Client fidèle — préfère WhatsApp.",
  tags: ["dakar", "pme"],
  isArchived: false,
  createdBy: null,
  createdAt: now(),
  updatedAt: now(),
};

const mockConversations: ConversationThread[] = [
  {
    id: "conv-wa-001",
    channel: "whatsapp",
    displayName: "Amadou Diallo",
    identifierLabel: "+221 •• •• 45 67",
    iaActive: true,
    lastMessageAt: now(),
    lastMessage: { sender: "client", preview: "Bonjour, avez-vous le devis final ?" },
    quote: { id: "q-mock-101", number: "DEV-2026-0042", status: "sent" },
    messages: [
      { id: "m1", sender: "client", content: "Bonjour, nous souhaitons un site vitrine pour notre boutique à Plateau.", deliveryStatus: null, createdAt: now() },
      { id: "m2", sender: "ia", content: "Bonjour Amadou ! Je peux vous préparer un devis express. Quel budget envisagez-vous ?", deliveryStatus: "sent", createdAt: now() },
      { id: "m3", sender: "client", content: "Bonjour, avez-vous le devis final ?", deliveryStatus: null, createdAt: now() },
    ],
    collected: { need: "Site vitrine 6 pages", budget: "2 500 000 – 3 000 000 FCFA", notes: "Livraison souhaitée avant fin novembre." },
  },
  {
    id: "conv-tg-002",
    channel: "telegram",
    displayName: "Fatou Ndiaye",
    identifierLabel: "@fatou_ndiaye",
    iaActive: false,
    lastMessageAt: now(),
    lastMessage: { sender: "freelance", preview: "Je vous envoie la facture d'acompte." },
    quote: null,
    messages: [{ id: "m4", sender: "freelance", content: "Je vous envoie la facture d'acompte.", deliveryStatus: "sent", createdAt: now() }],
    collected: { need: null, budget: null, notes: null },
  },
];

const mockDeliverables: Deliverable[] = [
  {
    id: "d-mock-1",
    organizationId: ORG,
    projectId: PROJECT,
    title: "Maquettes Figma v2",
    description: "Six écrans desktop + mobile",
    status: "approved",
    fileId: "file-del-1",
    fileName: "maquettes-v2.pdf",
    fileSizeBytes: "2481920",
    fileMime: "application/pdf",
    submittedAt: now(),
    reviewedAt: now(),
    reviewedByName: "Amadou Diallo",
    reviewedByEmail: "amadou@example.sn",
    rejectionReason: null,
    version: 1,
    parentId: null,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "d-mock-2",
    organizationId: ORG,
    projectId: PROJECT,
    title: "Intégration page d'accueil",
    description: null,
    status: "submitted",
    fileId: "file-del-2",
    fileName: "home-preview.zip",
    fileSizeBytes: "5120000",
    fileMime: "application/zip",
    submittedAt: now(),
    reviewedAt: null,
    reviewedByName: null,
    reviewedByEmail: null,
    rejectionReason: null,
    version: 1,
    parentId: null,
    createdAt: now(),
    updatedAt: now(),
  },
];

const mockReviews: Review[] = [
  {
    id: "rev-1",
    organizationId: ORG,
    requestId: "rr-1",
    projectId: PROJECT,
    clientId: CLIENT,
    rating: 5,
    comment: "Équipe réactive, livraison soignée. Je recommande !",
    submittedAt: now(),
    submittedByName: "Amadou Diallo",
    submittedByEmail: "amadou@example.sn",
    isPublic: true,
    moderationStatus: "approved",
  },
];

const mockProjects: ContravoProject[] = [
  {
    id: PROJECT,
    organizationId: ORG,
    clientId: CLIENT,
    code: "PRJ-DAK-24",
    name: "Site vitrine Diallo & Fils",
    description: "Refonte vitrine + catalogue produits",
    status: "on_hold",
    startDate: "2026-09-01",
    dueDate: "2026-11-30",
    deliveredAt: null,
    budgetCents: "2950000",
    currency: "XOF",
    plannedDeliverables: 3,
    ownerUserId: null,
    createdAt: now(),
    updatedAt: now(),
  },
];

const fileStore = new Map<string, ContravoFile>();

export const mocks = {
  listQuotes(q: ListQuery = {}): Quote[] {
    let rows = [...mockQuotes];
    if (q.clientId) rows = rows.filter((r) => r.clientId === q.clientId);
    if (q.projectId) rows = rows.filter((r) => r.projectId === q.projectId);
    if (q.status) rows = rows.filter((r) => r.status === q.status);
    return rows;
  },
  getQuote(id: string): Quote {
    const q = mockQuotes.find((x) => x.id === id);
    if (!q) throw new Error("NOT_FOUND");
    return q;
  },
  createQuote(input: CreateQuote): Quote {
    quoteSeq += 1;
    const discount = Number(input.discountCents ?? 0);
    const taxRateBps = input.taxRateBps ?? 1800;
    const totals = calcTotals(input.items, discount, taxRateBps);
    const q: Quote = {
      id: `q-mock-${quoteSeq}`,
      organizationId: ORG,
      projectId: input.projectId,
      clientId: input.clientId,
      number: `DEV-2026-${String(quoteSeq).padStart(4, "0")}`,
      status: input.status ?? "draft",
      currency: input.currency ?? "XOF",
      ...totals,
      taxRateBps,
      validUntil: input.validUntil,
      notes: input.notes ?? null,
      terms: input.terms ?? null,
      pdfFileId: null,
      sentAt: null,
      viewedAt: null,
      acceptedAt: null,
      acceptedByName: null,
      acceptedByEmail: null,
      rejectedAt: null,
      rejectionReason: null,
      pricingMode: input.pricingMode ?? "gross",
      desiredNetCents: null,
      createdAt: now(),
      updatedAt: now(),
      items: input.items.map((it, i) => ({
        ...it,
        id: `li-new-${i}`,
        unitPriceCents: String(it.unitPriceCents),
        totalCents: xof(Number(it.unitPriceCents) * Number(it.quantity)),
      })),
    };
    mockQuotes.unshift(q);
    return q;
  },
  transitionQuote(id: string, t: QuoteTransition): Quote {
    const q = mocks.getQuote(id);
    const map: Record<string, Quote["status"]> = {
      send: "sent",
      view: "viewed",
      accept: "accepted",
      reject: "rejected",
      cancel: "cancelled",
      expire: "expired",
    };
    q.status = map[t.action] ?? q.status;
    if (t.action === "send") q.sentAt = now();
    if (t.action === "reject") q.rejectionReason = t.reason ?? null;
    q.updatedAt = now();
    return q;
  },
  quotePdfUrl(id: string): string {
    mocks.getQuote(id);
    return `https://contravo.excellenceteam.site/mock/pdf/${id}.pdf`;
  },
  listInvoices(q: ListQuery = {}): Invoice[] {
    let rows = [...mockInvoices];
    if (q.clientId) rows = rows.filter((r) => r.clientId === q.clientId);
    if (q.projectId) rows = rows.filter((r) => r.projectId === q.projectId);
    if (q.status) rows = rows.filter((r) => r.status === q.status);
    return rows;
  },
  getInvoice(id: string): Invoice {
    const inv = mockInvoices.find((x) => x.id === id);
    if (!inv) throw new Error("NOT_FOUND");
    return inv;
  },
  transitionInvoice(id: string, action: string): Invoice {
    const inv = mocks.getInvoice(id);
    if (action === "send") inv.status = "sent";
    if (action === "mark_overdue") inv.status = "overdue";
    inv.updatedAt = now();
    return inv;
  },
  remindInvoice(id: string): { ok: true } {
    mocks.getInvoice(id);
    return { ok: true };
  },
  recordPayment(id: string, p: RecordPayment): Payment {
    const inv = mocks.getInvoice(id);
    const amt = Number(p.amountCents);
    const paid = Number(inv.amountPaidCents) + amt;
    const due = Math.max(0, Number(inv.totalCents) - paid);
    inv.amountPaidCents = xof(paid);
    inv.amountDueCents = xof(due);
    inv.status = due === 0 ? "paid" : "partial";
    if (due === 0) inv.paidAt = p.paidAt ?? now();
    inv.updatedAt = now();
    return { id: `pay-${Date.now()}`, invoiceId: id, amountCents: xof(amt), method: p.method, reference: p.reference ?? null, paidAt: p.paidAt ?? now(), createdAt: now() };
  },
  listContracts(q: ListQuery = {}): Contract[] {
    let rows = [...mockContracts];
    if (q.clientId) rows = rows.filter((r) => r.clientId === q.clientId);
    if (q.projectId) rows = rows.filter((r) => r.projectId === q.projectId);
    return rows;
  },
  getContract(id: string): Contract {
    const c = mockContracts.find((x) => x.id === id);
    if (!c) throw new Error("NOT_FOUND");
    return c;
  },
  getClient(id: string): ContravoClient {
    if (id !== CLIENT && !id.startsWith("cli-")) throw new Error("NOT_FOUND");
    return { ...mockClient, id };
  },
  listClientProjects(id: string): ContravoProject[] {
    mocks.getClient(id);
    return mockProjects.filter((p) => p.clientId === id || id === CLIENT);
  },
  listClientInvoices(id: string): Invoice[] {
    return mocks.listInvoices({ clientId: id === CLIENT ? CLIENT : id });
  },
  listConversations(q: { clientId?: string } = {}): ConversationSummary[] {
    return mockConversations.filter(() => !q.clientId || q.clientId === CLIENT).map(({ messages: _m, collected: _c, ...s }) => s);
  },
  getConversation(id: string): ConversationThread {
    const c = mockConversations.find((x) => x.id === id);
    if (!c) throw new Error("NOT_FOUND");
    return c;
  },
  sendMessage(conversationId: string, text: string): { message: ConversationMessage; iaActive: boolean } {
    const c = mocks.getConversation(conversationId);
    const message: ConversationMessage = { id: `m-${Date.now()}`, sender: "freelance", content: text, deliveryStatus: "sent", createdAt: now() };
    c.messages.push(message);
    c.iaActive = false;
    c.lastMessage = { sender: "freelance", preview: text.slice(0, 80) };
    c.lastMessageAt = now();
    return { message, iaActive: false };
  },
  presignUpload(input: PresignUploadInput): PresignUploadResult {
    const fileId = crypto.randomUUID();
    fileStore.set(fileId, {
      id: fileId,
      organizationId: ORG,
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: String(input.sizeBytes),
      sha256: null,
      kind: input.kind,
      status: "uploading",
      linkedEntityType: input.linkedEntityType ?? null,
      linkedEntityId: input.linkedEntityId ?? null,
      uploadedVia: "api",
      createdAt: now(),
    });
    return {
      fileId,
      uploadUrl: `mock-upload://${fileId}`,
      r2Key: `mock/${fileId}`,
      requiredHeaders: { "content-type": input.mimeType, "content-length": String(input.sizeBytes) },
    };
  },
  completeUpload(id: string): ContravoFile {
    const f = fileStore.get(id);
    if (!f) throw new Error("NOT_FOUND");
    f.status = "clean";
    return f;
  },
  downloadFile(id: string): FileDownload {
    if (!fileStore.has(id) && !id.startsWith("file-mock")) throw new Error("NOT_FOUND");
    return { url: `https://contravo.excellenceteam.site/mock/files/${id}`, expiresAt: new Date(Date.now() + 3600_000).toISOString() };
  },
  listDeliverables(projectId: string): Deliverable[] {
    return mockDeliverables.filter((d) => d.projectId === projectId || projectId === PROJECT);
  },
  listReviews(): Review[] {
    return mockReviews;
  },
  verifySignature(signatureId: string): SignatureVerification {
    return {
      valid: signatureId.length > 8,
      signedAt: now(),
      signerName: "Amadou Diallo",
      documentNumber: "CTR-2026-0009",
      signatureHash: "sha256-mock-ab12",
    };
  },
  defaultClientId: CLIENT,
  defaultProjectId: PROJECT,
};
