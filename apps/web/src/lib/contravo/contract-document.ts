/** Page imprimable d'un contrat tenu dans WINE. */

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char] ?? char;
  });
}

export function renderContractDocument(
  contract: { number: string; title: string; status: string; bodyMarkdown?: string | null; signedByName?: string | null },
  issuer?: { name: string; city?: string | null; email?: string | null }
): string {
  const seller = issuer?.name?.trim() || "WINE";
  const place = [issuer?.city, issuer?.email].filter(Boolean).join(" — ");
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(contract.number)}</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; color: #1c1917; white-space: pre-wrap; }
    h1 { font-weight: 500; white-space: normal; }
  </style>
</head>
<body>
  <p>${escapeHtml(seller)}</p>
  ${place ? `<p>${escapeHtml(place)}</p>` : ""}
  <h1>${escapeHtml(contract.title)}</h1>
  <p>${escapeHtml(contract.number)} · ${escapeHtml(contract.status)}</p>
  ${contract.signedByName ? `<p>Signé par ${escapeHtml(contract.signedByName)}</p>` : ""}
  <p>${escapeHtml(contract.bodyMarkdown ?? "")}</p>
</body>
</html>`;
}
