<?php

use App\Jobs\SendTaskDueReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// P0 "Scheduler & Rappels" : alerte 24h avant l'échéance d'une tâche critique.
Schedule::job(new SendTaskDueReminders)->hourly();
