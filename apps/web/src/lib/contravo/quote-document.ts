/** Page imprimable d'un devis tenu dans WINE. Les montants sont déjà en FCFA. */

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char] ?? char;
  });
}

function fcfa(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
}

export function renderQuoteDocument(quote: {
  number: string;
  status: string;
  currency: string;
  validUntil: string;
  totalCents: string;
  subtotalCents: string;
  discountCents?: string | number | null;
  taxCents: string;
  notes: string | null;
  items?: { description: string; quantity: string; unitPriceCents: string | number; totalCents: string }[];
}, issuer?: { name: string; city?: string | null; email?: string | null }): string {
  const rows = (quote.items ?? [])
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.description)}</td>
        <td>${escapeHtml(String(item.quantity))}</td>
        <td>${escapeHtml(fcfa(item.unitPriceCents))} ${escapeHtml(quote.currency)}</td>
        <td>${escapeHtml(fcfa(item.totalCents))} ${escapeHtml(quote.currency)}</td>
      </tr>`
    )
    .join("");

  const seller = issuer?.name?.trim() || "WINE";
  const place = [issuer?.city, issuer?.email].filter(Boolean).join(" — ");
  const discount = Number(quote.discountCents ?? 0);

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(quote.number)}</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; color: #1c1917; }
    h1 { font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
    th, td { text-align: left; padding: 0.5rem 0; border-bottom: 1px solid #e7e5e4; }
    .total { margin-top: 1.5rem; font-size: 1.25rem; }
  </style>
</head>
<body>
  <p>${escapeHtml(seller)}</p>
  ${place ? `<p>${escapeHtml(place)}</p>` : ""}
  <h1>Devis ${escapeHtml(quote.number)}</h1>
  <p>Statut : ${escapeHtml(quote.status)} · Valide jusqu'au ${escapeHtml(quote.validUntil)}</p>
  <table>
    <thead><tr><th>Prestation</th><th>Qté</th><th>Prix</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p>Sous-total ${escapeHtml(fcfa(quote.subtotalCents))} ${escapeHtml(quote.currency)}</p>
  ${discount > 0 ? `<p>Remise −${escapeHtml(fcfa(discount))} ${escapeHtml(quote.currency)}</p>` : ""}
  <p>TVA ${escapeHtml(fcfa(quote.taxCents))} ${escapeHtml(quote.currency)}</p>
  <p class="total">Total ${escapeHtml(fcfa(quote.totalCents))} ${escapeHtml(quote.currency)}</p>
  <p>Paiement accepté en Mobile Money (MTN MoMo, Moov Money, Celtiis Cash).</p>
  ${quote.notes ? `<p>${escapeHtml(quote.notes)}</p>` : ""}
</body>
</html>`;
}
