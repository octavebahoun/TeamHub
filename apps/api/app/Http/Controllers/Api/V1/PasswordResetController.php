<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    public const SENT_MESSAGE = 'Si un compte existe pour cette adresse, un lien de réinitialisation vient d\'être envoyé.';

    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'Indiquez votre adresse email.',
            'email.email' => 'Cette adresse email est invalide.',
        ]);

        // Même réponse si l'adresse est inconnue ou si une demande vient d'être faite :
        // on ne révèle pas quels comptes existent.
        Password::sendResetLink(['email' => $data['email']]);

        return response()->json(['message' => self::SENT_MESSAGE]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'email.required' => 'Indiquez votre adresse email.',
            'email.email' => 'Cette adresse email est invalide.',
            'token.required' => 'Le lien de réinitialisation est incomplet.',
            'password.required' => 'Choisissez un mot de passe.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'La confirmation ne correspond pas.',
        ]);

        $status = Password::reset(
            $data,
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['Ce lien est invalide ou a expiré.'],
            ]);
        }

        return response()->json(['message' => 'Mot de passe réinitialisé. Vous pouvez vous connecter.']);
    }
}
