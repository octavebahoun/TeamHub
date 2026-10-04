import { contravoFetch, contravoFetchRedirectUrl, useContravoMocks } from "./client";
import { mocks } from "./mocks";
import { ContravoError, type Contract, type ListQuery } from "./types";

export async function listContracts(query: ListQuery = {}): Promise<Contract[]> {
  if (useContravoMocks()) return mocks.listContracts(query);
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
  return contravoFetch<Contract>(`/contracts/${encodeURIComponent(id)}`);
}

export async function getContractPdfDownloadUrl(id: string): Promise<string> {
  if (useContravoMocks()) return mocks.quotePdfUrl(id);
  return contravoFetchRedirectUrl(`/contracts/${encodeURIComponent(id)}/pdf/download`);
}
