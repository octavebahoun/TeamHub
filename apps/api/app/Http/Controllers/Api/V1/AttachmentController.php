<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\Membership;
use App\Models\Project;
use App\Models\Task;
use App\Support\CurrentOrganization;
use App\Support\OrganizationRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Les documents d'équipe (chat, projet, tâche) sont stockés par WINE.
 * Les références Contravo restent possibles pour les pièces de facturation.
 */
class AttachmentController extends Controller
{
    private const MAX_BYTES = 25 * 1024 * 1024;

    private const ALLOWED_EXTENSIONS = [
        'pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'zip',
        'doc', 'docx', 'xls', 'xlsx', 'webm', 'mp4', 'mp3', 'm4a', 'ogg',
    ];

    public function storeStandalone(Request $request): JsonResponse
    {
        abort_if(OrganizationRole::of($request->user()) === Membership::ROLE_GUEST, 403);

        return response()->json($this->createAttachment($request, null), 201);
    }

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
        $this->authorize('view', $attachment);
        $this->authorizeAttachable($attachment->attachable, 'view');

        $data = $request->validate([
            'scan_status' => ['required', Rule::in(Attachment::STATUSES)],
        ]);

        $attachment->update($data);

        return response()->json($attachment->toSummary());
    }

    public function download(Attachment $attachment): StreamedResponse|JsonResponse
    {
        $this->authorize('view', $attachment);
        $this->authorizeAttachable($attachment->attachable, 'view');

        abort_unless($attachment->isDownloadable(), 422, 'Fichier indisponible : le scan antivirus n\'est pas encore validé.');

        if ($attachment->path) {
            abort_unless(Storage::disk('local')->exists($attachment->path), 404, 'Fichier introuvable.');

            return Storage::disk('local')->download($attachment->path, $attachment->name, [
                'Content-Type' => $attachment->mime ?: 'application/octet-stream',
            ]);
        }

        return response()->json(['contravo_file_id' => $attachment->contravo_file_id]);
    }

    public function destroy(Attachment $attachment): JsonResponse
    {
        $this->authorize('delete', $attachment);
        if ($attachment->path) {
            Storage::disk('local')->delete($attachment->path);
        }
        $attachment->delete();

        return response()->json(['message' => 'Pièce jointe supprimée.']);
    }

    protected function createAttachment(Request $request, ?Model $attachable): array
    {
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $this->assertAllowedFile($file);
            $orgId = CurrentOrganization::id() ?? $request->user()->current_organization_id;
            $path = $file->store('attachments/'.$orgId, 'local');
            $attrs = [
                'uploaded_by' => $request->user()->id,
                'contravo_file_id' => null,
                'path' => $path,
                'name' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType() ?: 'application/octet-stream',
                'size' => $file->getSize(),
                'scan_status' => Attachment::STATUS_READY,
            ];

            $attachment = $attachable
                ? $attachable->attachments()->create($attrs)
                : Attachment::create($attrs);

            return $attachment->toSummary();
        }

        $data = $request->validate([
            'contravo_file_id' => ['required', 'string', 'max:120', Rule::unique('attachments', 'contravo_file_id')],
            'name' => ['required', 'string', 'max:255'],
            'mime' => ['required', 'string', 'max:100'],
            'size' => ['required', 'integer', 'min:1'],
            'scan_status' => ['nullable', Rule::in(Attachment::STATUSES)],
        ]);

        $attrs = [
            'uploaded_by' => $request->user()->id,
            'contravo_file_id' => $data['contravo_file_id'],
            'name' => $data['name'],
            'mime' => $data['mime'],
            'size' => $data['size'],
            'scan_status' => $data['scan_status'] ?? Attachment::STATUS_PENDING,
        ];

        $attachment = $attachable
            ? $attachable->attachments()->create($attrs)
            : Attachment::create($attrs);

        return $attachment->toSummary();
    }

    protected function assertAllowedFile(UploadedFile $file): void
    {
        abort_if($file->getSize() > self::MAX_BYTES, 422, 'Le fichier dépasse la taille maximale de 25 Mo.');
        $ext = strtolower($file->getClientOriginalExtension());
        abort_unless(in_array($ext, self::ALLOWED_EXTENSIONS, true), 422, 'Type de fichier non autorisé.');
    }

    protected function authorizeAttachable(?Model $attachable, string $ability): void
    {
        if ($attachable === null) {
            return;
        }

        match (true) {
            $attachable instanceof Project, $attachable instanceof Task => $this->authorize($ability, $attachable),
            default => abort(403),
        };
    }
}
