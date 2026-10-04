export const GENERIC_USER_ERROR = "Une erreur s'est produite, veuillez réessayer.";

const FIELD_LABELS: Record<string, string> = {
  title: "Le titre",
  email: "L'email",
  body: "Le message",
  name: "Le nom",
  file: "Le fichier",
  password: "Le mot de passe",
  description: "La description",
};

const TECHNICAL =
  /route|not found|cannot (get|post|put|patch|delete)|enoent|econnrefused|stack trace|exception|sqlstate|undefined is not|failed to fetch|networkerror|status(text)?|endpoint|\/api\/|uploads\/presign|method not allowed|\b404\b|\b405\b|syntaxerror|typeerror|contravo \d+|next_public_|missing required|class ".+" not found/i;

const SAFE_FRENCH =
  /^(le |la |l'|les |ce |cet |cette |vous |ajoutez |choisissez |impossible |fichier |type |clé |relance |message |publication |tâche |projet |client |email |montant |aucun |pas )/i;

/** Message affichable : jamais une route, un code HTTP ou une exception. */
export function userFacingError(error: unknown): string {
  const raw = (error instanceof Error ? error.message : typeof error === "string" ? error : "")
    .replace(/^Contravo \d+:\s*/, "")
    .trim();
  if (!raw) return GENERIC_USER_ERROR;
  if (/the .+ field is required/i.test(raw)) return "Ce champ est obligatoire.";
  if (TECHNICAL.test(raw)) return GENERIC_USER_ERROR;
  if (raw.length > 160) return GENERIC_USER_ERROR;
  if (/[A-Z]{3,}_[A-Z]/.test(raw)) return GENERIC_USER_ERROR;
  if (SAFE_FRENCH.test(raw) || /[éèêàùçîô]/i.test(raw)) return raw;
  if (/[./\\{}<>`]/.test(raw)) return GENERIC_USER_ERROR;
  return GENERIC_USER_ERROR;
}

export function userFacingFieldError(message: string, field?: string): string {
  if (/required/i.test(message)) {
    const label = FIELD_LABELS[field ?? ""];
    return label ? `${label} est obligatoire.` : "Ce champ est obligatoire.";
  }
  return userFacingError(message);
}

export function translateFieldErrors(errors: Record<string, string[]>): Record<string, string> {
  return Object.fromEntries(Object.entries(errors).map(([key, messages]) => [key, userFacingFieldError(messages[0] ?? "", key)]));
}
