<?php

namespace App\Notifications;

use App\Models\Invitation;
use App\Models\Organization;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrganizationInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Invitation $invitation,
        public Organization $organization,
        public ?string $inviterName = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = $this->invitationUrl();
        $org = $this->organization->name;
        $from = $this->inviterName ? "{$this->inviterName} vous invite" : 'Vous êtes invité';

        return (new MailMessage)
            ->subject("Invitation à rejoindre {$org} sur WINE")
            ->greeting('Bonjour,')
            ->line("{$from} à rejoindre l'espace « {$org} » sur WINE.")
            ->action('Accepter l\'invitation', $url)
            ->line('Ce lien est valable 7 jours. Si vous n\'attendiez pas cette invitation, ignorez cet email.')
            ->salutation("L'équipe WINE");
    }

    public function invitationUrl(): string
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        return $frontend.'/invitation/'.$this->invitation->token;
    }
}
