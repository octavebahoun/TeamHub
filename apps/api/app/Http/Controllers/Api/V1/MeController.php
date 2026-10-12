<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('organizations', 'currentOrganization');

        return response()->json([
            'user' => $user,
            'organizations' => $user->organizations,
            'current_organization' => $user->currentOrganization,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'title' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:40'],
        ]);

        $user->update($data);

        return response()->json(['user' => $user->fresh()]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update(['password' => $data['password']]);

        // Les autres sessions (autres appareils, jeton volé) sont fermées ;
        // la session courante reste ouverte.
        $currentId = $user->currentAccessToken()?->id ?? null;
        $user->tokens()->when($currentId, fn ($q) => $q->whereKeyNot($currentId))->delete();

        return response()->json(['message' => 'Mot de passe modifié.']);
    }

    public function notifications(Request $request): JsonResponse
    {
        return response()->json($request->user()->notificationSettings());
    }

    public function updateNotifications(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate(
            collect(User::NOTIFICATION_DEFAULTS)
                ->map(fn () => ['sometimes', 'boolean'])
                ->all()
        );

        $user->update([
            'notification_preferences' => array_merge(
                $user->notificationSettings(),
                array_map(fn ($value) => (bool) $value, $data)
            ),
        ]);

        return response()->json($user->notificationSettings());
    }
}
