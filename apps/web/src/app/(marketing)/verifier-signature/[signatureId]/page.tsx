import type { Metadata } from "next";
import { files } from "@/lib/contravo";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ToneBadge } from "@/components/common/tone-badge";
import { shortDate } from "@/lib/format";

type Props = { params: Promise<{ signatureId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Vérification ${(await params).signatureId.slice(0, 8)}…` };
}

export default async function VerifySignaturePage({ params }: Props) {
  const { signatureId } = await params;
  let result: Awaited<ReturnType<typeof files.verifySignature>> | null = null;
  let error: string | null = null;
  try {
    result = await files.verifySignature(signatureId);
  } catch (e) {
    error = e instanceof Error ? e.message : "Vérification impossible.";
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Panel className="p-8">
        <PanelTitle className="mb-4">Vérifier une signature</PanelTitle>
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        {result && (
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">Statut</dt>
              <dd className="mt-1">
                <ToneBadge tone={result.valid ? "success" : "danger"}>{result.valid ? "Signature valide" : "Non reconnue"}</ToneBadge>
              </dd>
            </div>
            {result.signerName && (
              <div>
                <dt className="text-sm text-muted-foreground">Signataire</dt>
                <dd>{result.signerName}</dd>
              </div>
            )}
            {result.documentNumber && (
              <div>
                <dt className="text-sm text-muted-foreground">Document</dt>
                <dd>{result.documentNumber}</dd>
              </div>
            )}
            {result.signedAt && (
              <div>
                <dt className="text-sm text-muted-foreground">Signé le</dt>
                <dd>{shortDate(result.signedAt)}</dd>
              </div>
            )}
            {result.signatureHash && (
              <div>
                <dt className="text-sm text-muted-foreground">Empreinte</dt>
                <dd className="break-all font-mono text-xs">{result.signatureHash}</dd>
              </div>
            )}
          </dl>
        )}
      </Panel>
    </div>
  );
}
