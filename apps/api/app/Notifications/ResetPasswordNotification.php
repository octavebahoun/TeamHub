<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(public string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $minutes = (int) config('auth.passwords.users.expire');
        $url = $this->resetUrl($notifiable->email);

        return (new MailMessage)
            ->subject('Réinitialisation de votre mot de passe WINE')
            ->greeting('Bonjour '.$notifiable->name.',')
            ->line('Vous avez demandé à réinitialiser votre mot de passe.')
            ->action('Choisir un nouveau mot de passe', $url)
            ->line("Ce lien expire dans {$minutes} minutes. S'il ne vient pas de vous, ignorez cet email.")
            ->salutation("L'équipe WINE");
    }

    public function resetUrl(string $email): string
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        return $frontend.'/mot-de-passe-oublie/reinitialiser?'.http_build_query([
            'token' => $this->token,
            'email' => $email,
        ]);
    }
}
