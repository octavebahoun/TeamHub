<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use App\Support\CurrentOrganization;
use App\Support\OrganizationRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrationController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $organization = CurrentOrganization::get();
        abort_unless($organization, 409, 'Organisation introuvable.');

        $key = $organization->contravo_api_key;

        return response()->json([
            'configured' => filled($key),
            'hint' => filled($key) ? '…'.substr((string) $key, -4) : null,
            'billing_name' => $organization->billing_name ?: $organization->name,
            'billing_city' => $organization->billing_city,
            'billing_email' => $organization->billing_email,
            'can_manage' => OrganizationRole::of($request->user()) === Membership::ROLE_OWNER,
        ]);
    }

    /** Clé brute, lue par le serveur WINE pour appeler Contravo au nom de cet espace. */
    public function credential(): JsonResponse
    {
        $organization = CurrentOrganization::get();
        abort_unless($organization, 409, 'Organisation introuvable.');

        return response()->json([
            'api_key' => $organization->contravo_api_key,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $organization = CurrentOrganization::get();
        abort_unless($organization, 409, 'Organisation introuvable.');
        abort_unless(
            OrganizationRole::of($request->user()) === Membership::ROLE_OWNER,
            403,
            'Seul le propriétaire peut modifier la clé Contravo.'
        );

        $data = $request->validate([
            'api_key' => ['sometimes', 'nullable', 'string', 'max:500'],
            'billing_name' => ['sometimes', 'nullable', 'string', 'max:160'],
            'billing_city' => ['sometimes', 'nullable', 'string', 'max:120'],
            'billing_email' => ['sometimes', 'nullable', 'email', 'max:160'],
        ]);

        if (array_key_exists('api_key', $data)) {
            $value = trim((string) ($data['api_key'] ?? ''));
            $organization->contravo_api_key = $value === '' ? null : $value;
        }
        foreach (['billing_name', 'billing_city', 'billing_email'] as $field) {
            if (array_key_exists($field, $data)) {
                $value = trim((string) ($data[$field] ?? ''));
                $organization->{$field} = $value === '' ? null : $value;
            }
        }
        $organization->save();

        return $this->show($request);
    }
}
