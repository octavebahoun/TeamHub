<?php

namespace App\Jobs;

use App\Models\Task;
use App\Notifications\TaskDueReminderNotification;
use App\Services\InboxNotifier;
use App\Support\CurrentOrganization;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Planifié toutes les heures (voir routes/console.php). Alerte 24 h avant
 * l'échéance d'une tâche critique (priorité high/urgent) encore ouverte.
 * Un seul envoi par tâche (`due_reminder_sent_at`), par e-mail interne et
 * par notification dans la cloche. Sans assigné : alerte le responsable du
 * projet (règle du cahier des charges), jamais les deux à la fois.
 */
class SendTaskDueReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(InboxNotifier $inbox): void
    {
        $tomorrow = now()->addDay()->toDateString();

        Task::query()
            ->whereDate('due_date', $tomorrow)
            ->whereNull('due_reminder_sent_at')
            ->whereNull('completed_at')
            ->whereIn('priority', Task::CRITICAL_PRIORITIES)
            ->with('project.owner', 'assignee')
            ->each(function (Task $task) use ($inbox) {
                $this->remind($task, $inbox);
            });
    }

    protected function remind(Task $task, InboxNotifier $inbox): void
    {
        $recipient = $task->assignee ?? $task->project->owner;
        $unassigned = $task->assignee_id === null;

        if (! $recipient) {
            return;
        }

        CurrentOrganization::set($task->organization);

        $recipient->notify(new TaskDueReminderNotification($task, $unassigned));

        $inbox->toUser(
            $recipient->id,
            $unassigned ? 'task.unassigned_due_soon' : 'task.due_soon',
            'Échéance demain',
            $task->title,
            '/taches/'.$task->id,
            ['task_id' => $task->id, 'project_id' => $task->project_id]
        );

        $task->update(['due_reminder_sent_at' => now()]);

        CurrentOrganization::set(null);
    }
}
