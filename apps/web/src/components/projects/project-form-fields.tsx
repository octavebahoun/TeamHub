import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/common/native-select";
import { FieldError } from "@/components/common/field-error";
import { PROJECT_STATUS } from "@/lib/labels";
import type { Project } from "@/lib/api/types";

/** Champs partagés par la création et la modification d'un projet. */
export function ProjectFormFields({
  project,
  clients = [],
  errors = {},
}: {
  project?: Project;
  clients?: { id: number; label: string }[];
  errors?: Record<string, string>;
}) {
  const options = [...clients];
  if (project?.client && !options.some((client) => client.id === project.client?.id)) {
    options.unshift({ id: project.client.id, label: project.client.company || project.client.name });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="project-name">Nom du projet</Label>
        <Input id="project-name" name="name" required defaultValue={project?.name} aria-invalid={!!errors.name || undefined} />
        <FieldError message={errors.name} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="project-client">Client</Label>
        <NativeSelect id="project-client" name="client_id" defaultValue={String(project?.client_id ?? project?.client?.id ?? "")} aria-invalid={!!errors.client_id || undefined}>
          <option value="">Produit interne</option>
          {options.map((client) => (
            <option key={client.id} value={client.id}>
              {client.label}
            </option>
          ))}
        </NativeSelect>
        <FieldError message={errors.client_id} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="project-description">Description</Label>
        <Textarea id="project-description" name="description" rows={3} defaultValue={project?.description ?? ""} />
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
          <Input id="project-end" name="end_date" type="date" defaultValue={project?.end_date?.slice(0, 10) ?? ""} aria-invalid={!!errors.end_date || undefined} />
          <FieldError message={errors.end_date} />
        </div>
      </div>
    </div>
  );
}
