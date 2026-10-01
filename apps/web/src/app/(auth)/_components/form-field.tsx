import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";

/** Champ de formulaire étiqueté, avec aide et erreur reliées par aria-describedby. */
export function FormField({
  id,
  label,
  error,
  hint,
  aside,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string; hint?: string; aside?: React.ReactNode }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={id} className="text-[15px] font-semibold">
          {label}
        </Label>
        {aside}
      </div>
      <Input id={id} aria-invalid={!!error || undefined} aria-describedby={describedBy} className="h-12" {...input} />
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
