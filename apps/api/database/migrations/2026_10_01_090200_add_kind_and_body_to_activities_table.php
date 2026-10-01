<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Échanges CRM saisis à la main (note, appel, e-mail, rendez-vous) : kind + body.
// Les actions journalisées automatiquement gardent kind/body à null.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->string('kind', 20)->nullable()->after('action');
            $table->text('body')->nullable()->after('kind');
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn(['kind', 'body']);
        });
    }
};
