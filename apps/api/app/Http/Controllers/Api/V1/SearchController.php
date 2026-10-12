<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BillingQuote;
use App\Models\Client;
use App\Models\ClientConversationMessage;
use App\Models\Membership;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Support\Facades\Http;
use App\Support\OrganizationRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /api/v1/search?q= — projets, tâches, clients, scopé à l'organisation
 * courante et au rôle. Reprend exactement les règles déjà appliquées par
 * ProjectController/TaskController/ClientController::index : le membre et
 * l'invité ne voient que les projets dont ils sont membres (et aucun CRM),
 * le chef de projet (manager) ne voit que ses propres projets et clients.
 */
class SearchController extends Controller
{
    protected const LIMIT = 10;

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'min:1', 'max:120'],
        ]);

        $user = $request->user();
        $role = OrganizationRole::of($user);
        $term = '%'.$data['q'].'%';

        $projects = Project::query()
            ->whereNull('archived_at')
            ->where(fn (Builder $w) => $w->where('name', 'like', $term)->orWhere('description', 'like', $term))
            ->when($this->scopedToOwnProjects($role), fn (Builder $q) => $q->whereHas('members', fn ($m) => $m->whereKey($user->id)))
            ->when($role === Membership::ROLE_MANAGER, fn (Builder $q) => $q->where(
                fn (Builder $w) => $w->where('owner_id', $user->id)->orWhereHas('members', fn ($m) => $m->whereKey($user->id))
            ))
            ->latest()
            ->limit(self::LIMIT)
            ->get(['id', 'name', 'status']);

        $tasks = Task::query()
            ->where(fn (Builder $w) => $w->where('title', 'like', $term)->orWhere('description', 'like', $term))
            ->whereHas('project', function (Builder $q) use ($user, $role) {
                $q->when($this->scopedToOwnProjects($role), fn (Builder $qq) => $qq->whereHas('members', fn ($m) => $m->whereKey($user->id)))
                    ->when($role === Membership::ROLE_MANAGER, fn (Builder $qq) => $qq->where(
                        fn (Builder $w) => $w->where('owner_id', $user->id)->orWhereHas('members', fn ($m) => $m->whereKey($user->id))
                    ));
            })
            ->with('project:id,name')
            ->latest()
            ->limit(self::LIMIT)
            ->get(['id', 'title', 'status', 'project_id']);

        $clients = collect();
        if (OrganizationRole::isManager($user)) {
            $clients = Client::query()
                ->where(fn (Builder $w) => $w->where('name', 'like', $term)
                    ->orWhere('company', 'like', $term)
                    ->orWhere('email', 'like', $term))
                ->when($role === Membership::ROLE_MANAGER, fn (Builder $q) => $q->where('owner_id', $user->id))
                ->latest()
                ->limit(self::LIMIT)
                ->get(['id', 'name', 'company']);
        }

        $quotes = collect();
        $messages = collect();
        if (OrganizationRole::isManager($user)) {
            $quotes = BillingQuote::query()
                ->where(fn (Builder $w) => $w->where('number', 'like', $term)->orWhere('notes', 'like', $term))
                ->when($role === Membership::ROLE_MANAGER, fn (Builder $q) => $q->whereHas(
                    'project',
                    fn ($p) => $p->where('owner_id', $user->id)->orWhereHas('members', fn ($m) => $m->whereKey($user->id))
                ))
                ->latest()
                ->limit(self::LIMIT)
                ->get()
                ->map(fn (BillingQuote $quote) => [
                    'id' => $quote->id,
                    'number' => $quote->number,
                    'title' => $quote->number,
                    'amount_xof' => (int) $quote->total,
                    'project_id' => $quote->project_id,
                ]);

            $messages = ClientConversationMessage::query()
                ->where('body', 'like', $term)
                ->with('conversation.client:id,name,company')
                ->latest()
                ->limit(self::LIMIT)
                ->get()
                ->map(fn (ClientConversationMessage $message) => [
                    'id' => (string) $message->id,
                    'body' => $message->body,
                    'channel' => $message->conversation?->channel,
                    'client_id' => $message->conversation?->client_id,
                    'client_name' => $message->conversation?->client?->company ?: $message->conversation?->client?->name,
                ]);
        }

        return response()->json([
            'query' => $data['q'],
            'projects' => $projects,
            'tasks' => $tasks,
            'clients' => $clients,
            'quotes' => collect($quotes->all())->values(),
            'messages' => collect($messages->all())->merge($this->chatHits($user->id, $data['q']))->take(self::LIMIT)->values(),
        ]);
    }

    // Membre et invité : seulement les projets dont ils sont membres. L'invité
    // n'a par ailleurs qu'un seul projet en pratique (règle produit), mais la
    // requête reste la même — c'est l'appartenance qui filtre, pas le rôle en soi.
    /** Messages du chat (Mongo) si le service temps réel répond. */
    protected function chatHits(int $userId, string $q): array
    {
        $secret = (string) config('services.internal.secret');
        if ($secret === '') {
            return [];
        }

        try {
            $response = Http::withHeaders(['X-Internal-Secret' => $secret, 'Accept' => 'application/json'])
                ->timeout(1)
                ->get(rtrim((string) config('services.realtime.base_url', 'http://127.0.0.1:4000'), '/').'/internal/search', [
                    'q' => $q,
                    'organization_id' => \App\Support\CurrentOrganization::id(),
                    'user_id' => $userId,
                ]);
            if (! $response->successful()) {
                return [];
            }

            return $response->json('messages') ?? [];
        } catch (\Throwable) {
            return [];
        }
    }

    protected function scopedToOwnProjects(?string $role): bool
    {
        return in_array($role, [Membership::ROLE_MEMBER, Membership::ROLE_GUEST], true);
    }
}
