import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/common/native-select";
import { FieldError } from "@/components/common/field-error";
import { CharCountInput, CharCountTextarea } from "@/components/ui/char-count-input";
import { Input } from "@/components/ui/input";
import { PROJECT_STATUS } from "@/lib/labels";
import type { Project } from "@/lib/api/types";

/** Champs partagés par la création et la modification d'un projet. */
export function ProjectFormFields({ project, errors = {} }: { project?: Project; errors?: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="project-name">
          Nom du projet
          <span className="ml-1 text-primary" aria-hidden>
            *
          </span>
          <span className="sr-only"> (obligatoire)</span>
        </Label>
        <CharCountInput
          id="project-name"
          name="name"
          required
          maxLength={200}
          defaultValue={project?.name}
          aria-invalid={!!errors.name || undefined}
        />
        <FieldError message={errors.name} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="project-description">Description</Label>
        <CharCountTextarea
          id="project-description"
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={project?.description ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="project-status">Statut</Label>
          <NativeSelect id="project-status" name="status" defaultValue={project?.status ?? "upcoming"}>
            {Object.entries(PROJECT_STATUS).map(([value, s]) => (
              <option key={value} value={value}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="project-start">Début</Label>
          <Input id="project-start" name="start_date" type="date" defaultValue={project?.start_date?.slice(0, 10) ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="project-end">Échéance</Label>
          <Input
            id="project-end"
            name="end_date"
            type="date"
            defaultValue={project?.end_date?.slice(0, 10) ?? ""}
            aria-invalid={!!errors.end_date || undefined}
          />
          <FieldError message={errors.end_date} />
        </div>
      </div>
    </div>
  );
}
