import { contravoFetch, contravoFetchRedirectUrl, useContravoMocks, useLocalBilling } from "./client";
import * as ledger from "./ledger";
import { mocks } from "./mocks";
import { ContravoError, type Contract, type CreateContract, type ListQuery } from "./types";

export async function createContract(input: CreateContract): Promise<Contract> {
  if (useContravoMocks()) {
    return {
      id: `c-mock-${Date.now()}`,
      organizationId: "org",
      projectId: input.projectId,
      clientId: input.clientId,
      quoteId: input.quoteId ?? null,
      number: "CTR-MOCK",
      title: input.title,
      status: "draft",
      bodyMarkdown: input.bodyMarkdown ?? null,
      pdfFileId: null,
      signedPdfFileId: null,
      sentAt: null,
      signedAt: null,
      signedByName: null,
      signedByEmail: null,
      signatureHash: null,
      expiresAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  if (await useLocalBilling()) return ledger.createContract(input);
  return contravoFetch<Contract>("/contracts", { method: "POST", body: input });
}

export async function signContract(id: string, signerName: string, signerEmail?: string): Promise<Contract> {
  if (useContravoMocks()) {
    const contract = mocks.getContract(id);
    return {
      ...contract,
      status: "signed",
      signedByName: signerName,
      signedByEmail: signerEmail ?? null,
      signedAt: new Date().toISOString(),
    };
  }
  if (await useLocalBilling()) return ledger.signContract(id, signerName, signerEmail);
  return contravoFetch<Contract>(`/contracts/${encodeURIComponent(id)}/sign`, {
    method: "POST",
    body: { signerName, signerEmail },
  });
}

export async function listContracts(query: ListQuery = {}): Promise<Contract[]> {
  if (useContravoMocks()) return mocks.listContracts(query);
  if (await useLocalBilling()) return ledger.listContracts(query);
  const res = await contravoFetch<{ contracts: Contract[] }>("/contracts", { query });
  return res.contracts;
}

export async function getContract(id: string): Promise<Contract> {
  if (useContravoMocks()) {
    try {
      return mocks.getContract(id);
    } catch {
      throw new ContravoError(404, "Contrat introuvable.");
    }
  }
  if (await useLocalBilling()) return ledger.getContract(id);
  return contravoFetch<Contract>(`/contracts/${encodeURIComponent(id)}`);
}

export async function getContractPdfDownloadUrl(id: string): Promise<string> {
  if (useContravoMocks()) return mocks.quotePdfUrl(id);
  return contravoFetchRedirectUrl(`/contracts/${encodeURIComponent(id)}/pdf/download`);
}
