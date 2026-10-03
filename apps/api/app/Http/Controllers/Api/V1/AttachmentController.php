<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Les fichiers sont téléversés et scannés chez Contravo (POST /uploads/presign
 * puis /complete, côté Next.js — apps/web/src/lib/contravo/files.ts). WINE ne
 * stocke que la référence : ce contrôleur enregistre la métadonnée après coup,
 * et n'autorise le téléchargement que si le scan antivirus est passé.
 */
class AttachmentController extends Controller
{
    public function storeForProject(Request $request, Project $project): JsonResponse
    {
        $this->authorize('attach', $project);

        return response()->json($this->createAttachment($request, $project), 201);
    }

    public function storeForTask(Request $request, Task $task): JsonResponse
    {
        $this->authorize('attach', $task);

        return response()->json($this->createAttachment($request, $task), 201);
    }

    public function update(Request $request, Attachment $attachment): JsonResponse
    {
        $this->authorizeAttachable($attachment->attachable, 'view');

        $data = $request->validate([
            'scan_status' => ['required', Rule::in(Attachment::STATUSES)],
        ]);

        $attachment->update($data);

        return response()->json($attachment->toSummary());
    }

    public function download(Attachment $attachment): JsonResponse
    {
        $this->authorizeAttachable($attachment->attachable, 'view');

        abort_unless($attachment->isDownloadable(), 422, 'Fichier indisponible : le scan antivirus n\'est pas encore validé.');

        // L'API Laravel n'héberge aucun octet : elle renvoie la référence Contravo,
        // que le frontend résout via son pont serveur (clé Contravo jamais exposée ici).
        return response()->json(['contravo_file_id' => $attachment->contravo_file_id]);
    }

    public function destroy(Attachment $attachment): JsonResponse
    {
        $this->authorize('delete', $attachment);
        $attachment->delete();

        return response()->json(['message' => 'Pièce jointe supprimée.']);
    }

    protected function createAttachment(Request $request, Model $attachable): array
    {
        $data = $request->validate([
            'contravo_file_id' => ['required', 'string', 'max:120', Rule::unique('attachments', 'contravo_file_id')],
            'name' => ['required', 'string', 'max:255'],
            'mime' => ['required', 'string', 'max:100'],
            'size' => ['required', 'integer', 'min:1'],
            'scan_status' => ['nullable', Rule::in(Attachment::STATUSES)],
        ]);

        $attachment = $attachable->attachments()->create([
            'uploaded_by' => $request->user()->id,
            'contravo_file_id' => $data['contravo_file_id'],
            'name' => $data['name'],
            'mime' => $data['mime'],
            'size' => $data['size'],
            'scan_status' => $data['scan_status'] ?? Attachment::STATUS_PENDING,
        ]);

        return $attachment->toSummary();
    }

    protected function authorizeAttachable(Model $attachable, string $ability): void
    {
        match (true) {
            $attachable instanceof Project, $attachable instanceof Task => $this->authorize($ability, $attachable),
            default => abort(403),
        };
    }
}
