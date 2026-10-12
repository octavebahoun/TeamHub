/** Libellés FR des champs API (évite les noms techniques dans l'UI). */
const FIELD_LABELS: Record<string, string> = {
  name: "Nom",
  email: "Email",
  password: "Mot de passe",
  password_confirmation: "Confirmation du mot de passe",
  current_password: "Mot de passe actuel",
  organization_name: "Nom de l'organisation",
  title: "Titre",
  description: "Description",
  project_id: "Projet",
  assignee_id: "Assignée à",
  due_date: "Échéance",
  start_date: "Début",
  end_date: "Échéance",
  status: "Statut",
  priority: "Priorité",
  body: "Message",
  terms: "Conditions d'utilisation",
  company: "Entreprise",
  phone: "Téléphone",
  amount: "Montant",
};

/** Traduit un message Laravel/anglais vers le français, avec libellé de champ lisible. */
export function localizeMessage(message: string, field?: string): string {
  const label = (field && FIELD_LABELS[field]) || field || "Ce champ";
  const m = message.trim();

  const patterns: [RegExp, string][] = [
    [/^The .+ field is required\.?$/i, `${label} est obligatoire.`],
    [/^The .+ field must be a valid email address\.?$/i, `${label} doit être une adresse email valide.`],
    [/^The .+ must be a valid email address\.?$/i, `${label} doit être une adresse email valide.`],
    [/^The .+ field must be at least (\d+) characters\.?$/i, `${label} doit contenir au moins $1 caractères.`],
    [/^The .+ must be at least (\d+) characters\.?$/i, `${label} doit contenir au moins $1 caractères.`],
    [/^The .+ field must not be greater than (\d+) characters\.?$/i, `${label} ne peut pas dépasser $1 caractères.`],
    [/^The .+ may not be greater than (\d+) characters\.?$/i, `${label} ne peut pas dépasser $1 caractères.`],
    [/^The .+ field must be (\d+) characters\.?$/i, `${label} doit contenir $1 caractères.`],
    [/^The .+ confirmation does not match\.?$/i, `La confirmation ne correspond pas.`],
    [/^The .+ has already been taken\.?$/i, `${label} est déjà utilisé.`],
    [/^These credentials do not match our records\.?$/i, `Identifiants incorrects.`],
    [/^The given data was invalid\.?$/i, `Certaines informations sont invalides.`],
    [/^validation\..+$/i, `${label} est invalide.`],
  ];

  for (const [re, tpl] of patterns) {
    const match = m.match(re);
    if (match) {
      return tpl.replace(/\$(\d+)/g, (_, i) => match[Number(i)] ?? "");
    }
  }

  // Remplace les noms techniques restants dans le message.
  if (field && FIELD_LABELS[field]) {
    return m
      .replace(new RegExp(`\\b${field}\\b`, "gi"), FIELD_LABELS[field])
      .replace(/^The /i, "")
      .replace(/ field /gi, " ");
  }
  return m;
}

/** Localise la map d'erreurs API → messages FR prêts pour l'UI. */
export function localizeFieldErrors(errors: Record<string, string[] | string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => {
      const msg = Array.isArray(value) ? value[0] ?? "" : value;
      return [key, localizeMessage(msg, key)];
    })
  );
}

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}
