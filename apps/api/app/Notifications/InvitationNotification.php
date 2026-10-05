<?php

namespace App\Notifications;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * E-mail interne WINE envoyé à une adresse qui n'a pas encore de compte.
 * Le lien ouvre la page publique /invitation/{token} du frontend.
 */
class InvitationNotification extends Notification
{
    use Queueable;

    public function __construct(public Invitation $invitation) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $invitation = $this->invitation;
        $invitation->loadMissing('organization:id,name', 'invitedBy:id,name');

        $organization = $invitation->organization->name;
        $inviter = $invitation->invitedBy?->name;
        $role = self::rolePhrase($invitation->role);
        $expires = $invitation->expires_at->locale('fr')->isoFormat('D MMMM YYYY');

        $intro = $inviter
            ? "{$inviter} vous invite à rejoindre {$organization} sur WINE, {$role}."
            : "Vous êtes invité à rejoindre {$organization} sur WINE, {$role}.";

        return (new MailMessage)
            ->subject("Invitation à rejoindre {$organization} sur WINE")
            ->greeting('Bonjour,')
            ->line($intro)
            ->action('Rejoindre '.$organization, $this->acceptUrl())
            ->line("Ce lien expire le {$expires}. S'il ne vous est pas destiné, ignorez cet e-mail.")
            ->salutation("L'équipe WINE");
    }

    public function acceptUrl(): string
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        return $frontend.'/invitation/'.$this->invitation->token;
    }

    public static function rolePhrase(string $role): string
    {
        return match ($role) {
            'admin' => "en tant qu'administrateur",
            'manager' => 'en tant que chef de projet',
            'guest' => "en tant qu'invité",
            default => 'en tant que membre',
        };
    }
}
