<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Décision d'équipe (Octave) : les fichiers restent hébergés chez Contravo
// (upload, scan antivirus, stockage). WINE ne garde que la métadonnée et la
// référence externe pour afficher la liste et autoriser le téléchargement.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->dropColumn('path');
            $table->string('contravo_file_id')->nullable()->unique()->after('attachable_id');
            $table->string('scan_status')->default('pending')->after('size');
        });
    }

    public function down(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->string('path')->after('attachable_id');
            $table->dropColumn(['contravo_file_id', 'scan_status']);
        });
    }
};
