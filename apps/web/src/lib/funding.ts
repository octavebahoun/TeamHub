/** Texte du bandeau financement. On ne parle d'une facture que si elle est vraiment liée. */
export function fundingMessage(hasInvoice: boolean): { label: string; detail: string } {
  if (hasInvoice) {
    return {
      label: "Facture enregistrée",
      detail: "Une facture est liée à ce projet.",
    };
  }
  return {
    label: "Pas encore de facture",
    detail: "Aucune facture n'est liée à ce projet.",
  };
}
