<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Opportunity;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Rattache après coup un objet WINE à l'identifiant que Contravo lui a
 * attribué, sans dépendre d'un champ `reference` que Contravo devrait nous
 * renvoyer fidèlement dans ses webhooks (hypothèse fragile — dépend du code
 * Next.js qui crée l'objet chez Contravo, hors de notre contrôle ici).
 *
 * Flux attendu : le frontend crée le devis/la facture/etc. chez Contravo
 * (avec sa clé serveur), récupère l'id que Contravo lui renvoie, puis
 * appelle immédiatement cet endpoint pour que ContravoWebhookController
 * puisse ensuite retrouver l'objet WINE quand Contravo rappellera.
 */
class ContravoLinkController extends Controller
{
    /**
     * @var array<string, array{0: class-string, 1: string}>
     */
    protected const MAP = [
        'quote' => [Opportunity::class, 'contravo_quote_id'],
        'invoice' => [Project::class, 'contravo_invoice_id'],
        'contract' => [Project::class, 'contravo_contract_id'],
        'deliverable' => [Task::class, 'contravo_deliverable_id'],
        'client' => [Client::class, 'contravo_client_id'],
        'project' => [Project::class, 'contravo_project_id'],
    ];

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'in:'.implode(',', array_keys(self::MAP))],
            'id' => ['required', 'integer'],
            'contravo_id' => ['required', 'string', 'max:191'],
        ]);

        [$modelClass, $column] = self::MAP[$data['type']];

        // findOrFail respecte l'OrganizationScope du modèle : impossible de
        // lier un objet d'une autre organisation (404, pas de fuite inter-org).
        $model = $modelClass::findOrFail($data['id']);

        $this->authorize('update', $model);

        if ($model->{$column} && $model->{$column} !== $data['contravo_id']) {
            abort(409, 'Cet élément WINE est déjà lié à un autre identifiant Contravo.');
        }

        try {
            $model->update([$column => $data['contravo_id']]);
        } catch (QueryException) {
            // Contrainte unique : cet identifiant Contravo est déjà pris par un autre objet WINE.
            abort(409, 'Cet identifiant Contravo est déjà utilisé par un autre élément WINE.');
        }

        return response()->json([
            'ok' => true,
            'type' => $data['type'],
            'id' => $model->id,
            'contravo_id' => $data['contravo_id'],
        ]);
    }
}
