<?php

namespace App\Services;

use App\Models\BillingInvoice;
use App\Models\BillingPayment;
use App\Models\Membership;
use App\Models\Opportunity;
use App\Models\Project;
use App\Models\Task;
use App\Support\CurrentOrganization;
use Carbon\Carbon;

/**
 * Mêmes chiffres que le service data, calculés dans Laravel.
 * Sert quand le service Python est arrêté, et pour le cash réel des factures WINE.
 */
class LocalAnalytics
{
    public function overview(?int $ownerId): array
    {
        $projects = Project::query()
            ->whereNull('archived_at')
            ->when($ownerId, fn ($q) => $q->where('owner_id', $ownerId));

        $active = (clone $projects)->whereIn('status', [Project::STATUS_UPCOMING, Project::STATUS_IN_PROGRESS])->count();

        $tasks = Task::query()->when($ownerId, fn ($q) => $q->whereHas('project', fn ($p) => $p->where('owner_id', $ownerId)));

        $overdue = (clone $tasks)
            ->where('status', '!=', Task::STATUS_DONE)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', now()->toDateString())
            ->count();

        $completed = (clone $tasks)
            ->where('status', Task::STATUS_DONE)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->subDays(30))
            ->count();

        $late = Project::query()
            ->whereNull('archived_at')
            ->when($ownerId, fn ($q) => $q->where('owner_id', $ownerId))
            ->withCount(['tasks as overdue' => fn ($q) => $q
                ->where('status', '!=', Task::STATUS_DONE)
                ->whereNotNull('due_date')
                ->whereDate('due_date', '<', now()->toDateString())])
            ->get(['id', 'name'])
            ->filter(fn (Project $project) => (int) $project->overdue > 0)
            ->sortByDesc('overdue')
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'overdue' => (int) $project->overdue,
            ])
            ->values()
            ->all();

        return [
            'active_projects' => $active,
            'overdue_tasks' => $overdue,
            'workload' => $this->workload($ownerId),
            'completed_tasks' => $completed,
            'completed_per_week' => $this->completedPerWeek($ownerId),
            'late_projects' => $late,
            'profitability' => $this->profitability($ownerId),
        ];
    }

    public function pipeline(?int $ownerId): array
    {
        $rows = Opportunity::query()
            ->when($ownerId, fn ($q) => $q->where('owner_id', $ownerId))
            ->selectRaw('stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as amount')
            ->groupBy('stage')
            ->get();

        return [
            'by_stage' => $rows->map(fn ($row) => [
                'stage' => $row->stage,
                'count' => (int) $row->count,
                'amount' => (float) $row->amount,
            ])->values()->all(),
        ];
    }

    public function finance(?int $ownerId): array
    {
        $invoices = BillingInvoice::query()
            ->when($ownerId, fn ($q) => $q->whereHas('project', fn ($p) => $p->where('owner_id', $ownerId)));
        $revenue = (int) (clone $invoices)->sum('total');
        $cash = (int) BillingPayment::query()
            ->when($ownerId, fn ($q) => $q->whereHas('invoice.project', fn ($p) => $p->where('owner_id', $ownerId)))
            ->sum('amount');

        $openQuotes = (int) \App\Models\BillingQuote::query()
            ->whereIn('status', ['draft', 'sent'])
            ->when($ownerId, fn ($q) => $q->whereHas('project', fn ($p) => $p->where('owner_id', $ownerId)))
            ->sum('total');

        return [
            'revenue_xof' => $revenue,
            'cash_xof' => $cash,
            'margin_xof' => $cash,
            'margin_rate' => $revenue > 0 ? round($cash / $revenue, 4) : 0.0,
            'open_quotes_xof' => $openQuotes,
        ];
    }

    public function summary(?int $ownerId): array
    {
        $overview = $this->overview($ownerId);
        $start = now()->startOfWeek();
        $end = now()->endOfWeek();
        $finance = $this->finance($ownerId);
        $profit = $overview['profitability'];
        $headline = $overview['overdue_tasks'] > 0
            ? $overview['overdue_tasks'].' tâche(s) en retard cette semaine'
            : $overview['active_projects'].' projet(s) actif(s), rien en retard';
        $narrative = sprintf(
            '%d projet(s) actif(s), %s FCFA facturés, %s FCFA encaissés. Pipeline ouvert : %s FCFA.',
            $overview['active_projects'],
            number_format($finance['revenue_xof'], 0, ',', ' '),
            number_format($finance['cash_xof'], 0, ',', ' '),
            number_format((float) $profit['open_amount'], 0, ',', ' ')
        );
        $priorities = [];
        if ($overview['overdue_tasks'] > 0) {
            $priorities[] = 'Réassigner ou clôturer les tâches en retard';
        }
        if ((float) $profit['open_amount'] > 0) {
            $priorities[] = 'Relancer les opportunités ouvertes du pipeline';
        }
        if ($finance['revenue_xof'] > $finance['cash_xof']) {
            $priorities[] = 'Encaisser les factures encore dues';
        }

        return [
            'period' => ['from' => $start->toDateString(), 'to' => $end->toDateString()],
            'source' => 'fallback',
            'kpis' => [
                'active_projects' => $overview['active_projects'],
                'overdue_tasks' => $overview['overdue_tasks'],
                'completed_tasks_week' => 0,
                'new_opportunities' => 0,
                'won_count' => $profit['won_count'],
                'won_amount' => $profit['won_amount'],
                'open_amount' => $profit['open_amount'],
                'win_rate' => $profit['win_rate'],
                'messages' => 0,
                'active_channels' => 0,
            ],
            'workload' => $overview['workload'],
            'profitability' => $profit,
            'chat' => ['messages' => 0, 'active_channels' => 0, 'available' => false],
            'headline' => $headline,
            'narrative' => $narrative,
            'priorities' => array_slice($priorities, 0, 3),
        ];
    }

    public function profitability(?int $ownerId): array
    {
        $rows = Opportunity::query()
            ->when($ownerId, fn ($q) => $q->where('owner_id', $ownerId))
            ->get(['stage', 'amount']);

        $bucket = function (string $stage) use ($rows): array {
            $items = $rows->where('stage', $stage);

            return [$items->count(), (float) $items->sum('amount')];
        };

        [$wonCount, $wonAmount] = $bucket('won');
        [$lostCount, $lostAmount] = $bucket('lost');
        $openCount = 0;
        $openAmount = 0.0;
        foreach (['prospect', 'contacted', 'proposal'] as $stage) {
            [$count, $amount] = $bucket($stage);
            $openCount += $count;
            $openAmount += $amount;
        }
        $closed = $wonCount + $lostCount;

        return [
            'won_amount' => $wonAmount,
            'lost_amount' => $lostAmount,
            'open_amount' => $openAmount,
            'won_count' => $wonCount,
            'lost_count' => $lostCount,
            'open_count' => $openCount,
            'win_rate' => $closed ? round($wonCount / $closed, 4) : 0.0,
            'won_amount_30d' => (float) Opportunity::query()
                ->when($ownerId, fn ($q) => $q->where('owner_id', $ownerId))
                ->where('stage', 'won')
                ->whereNotNull('closed_at')
                ->where('closed_at', '>=', now()->subDays(30))
                ->sum('amount'),
        ];
    }

    /**
     * @return array<int, array{user_id: int, name: string, open_tasks: int}>
     */
    protected function workload(?int $ownerId): array
    {
        return Membership::query()
            ->where('organization_id', CurrentOrganization::id())
            ->with('user:id,name')
            ->get()
            ->map(function (Membership $membership) use ($ownerId) {
                $open = Task::query()
                    ->where('assignee_id', $membership->user_id)
                    ->where('status', '!=', Task::STATUS_DONE)
                    ->when($ownerId, fn ($q) => $q->whereHas('project', fn ($p) => $p->where('owner_id', $ownerId)))
                    ->count();

                return [
                    'user_id' => $membership->user_id,
                    'name' => $membership->user?->name ?? 'Membre',
                    'open_tasks' => $open,
                ];
            })
            ->sortByDesc('open_tasks')
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{week: string, count: int}>
     */
    protected function completedPerWeek(?int $ownerId): array
    {
        $today = now()->startOfDay();
        $first = $today->copy()->startOfWeek()->subWeeks(4);
        $rows = Task::query()
            ->where('status', Task::STATUS_DONE)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $first)
            ->when($ownerId, fn ($q) => $q->whereHas('project', fn ($p) => $p->where('owner_id', $ownerId)))
            ->get(['completed_at']);

        $buckets = [];
        foreach ($rows as $task) {
            $week = Carbon::parse($task->completed_at)->isoWeek();
            $year = Carbon::parse($task->completed_at)->isoWeekYear();
            $buckets[$year.'-'.$week] = ($buckets[$year.'-'.$week] ?? 0) + 1;
        }

        $out = [];
        for ($i = 0; $i < 5; $i++) {
            $day = $first->copy()->addWeeks($i);
            $key = $day->isoWeekYear().'-'.$day->isoWeek();
            $out[] = ['week' => 'S'.$day->isoWeek(), 'count' => $buckets[$key] ?? 0];
        }

        return $out;
    }
}
