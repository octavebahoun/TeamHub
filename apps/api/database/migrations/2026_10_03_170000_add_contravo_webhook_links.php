<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Colonnes nécessaires pour que les webhooks Contravo deliverable.* et
     * conversation.message_received puissent retrouver la tâche / le client
     * WINE correspondant (même principe que contravo_quote_id, etc.).
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('contravo_deliverable_id')->nullable()->unique()->after('due_reminder_sent_at');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->string('contravo_client_id')->nullable()->unique()->after('owner_id');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('contravo_deliverable_id');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('contravo_client_id');
        });
    }
};
