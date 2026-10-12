export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {}
  ) {
    super(message);
  }

  /** Premier message d'erreur d'un champ (validation 422). */
  field(name: string): string | undefined {
    return this.errors[name]?.[0];
  }
}
