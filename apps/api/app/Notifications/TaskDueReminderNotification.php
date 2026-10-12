<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * E-mail interne WINE (le 3e, avec invitation et mot de passe). Envoyé par
 * SendTaskDueReminders, soit à l'assigné, soit au responsable du projet si
 * la tâche n'a personne — jamais aux deux pour la même tâche.
 */
class TaskDueReminderNotification extends Notification
{
    use Queueable;

    public function __construct(public Task $task, public bool $unassigned = false) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $url = $frontend.'/taches/'.$this->task->id;

        $message = (new MailMessage)
            ->subject('Échéance demain : « '.$this->task->title.' »')
            ->greeting('Bonjour '.$notifiable->name.',');

        if ($this->unassigned) {
            $message->line('La tâche « '.$this->task->title.' » arrive à échéance demain et n\'a toujours personne pour la prendre en charge.');
        } else {
            $message->line('Votre tâche « '.$this->task->title.' » arrive à échéance demain.');
        }

        return $message
            ->action('Voir la tâche', $url)
            ->salutation("L'équipe WINE");
    }
}
