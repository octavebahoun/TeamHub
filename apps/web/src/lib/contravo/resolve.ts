import { useContravoMocks } from "./client";
import { mocks as contravoMocks } from "./mocks";

/** Identifiants Contravo liés à WINE — en mock, des UUID de démo Afrique de l'Ouest. */
export function resolveContravoClientId(linkedId?: string | null): string | null {
  if (linkedId) return linkedId;
  if (useContravoMocks()) return contravoMocks.defaultClientId;
  return null;
}

export function resolveContravoProjectId(linkedId?: string | null): string | null {
  if (linkedId) return linkedId;
  if (useContravoMocks()) return contravoMocks.defaultProjectId;
  return null;
}
