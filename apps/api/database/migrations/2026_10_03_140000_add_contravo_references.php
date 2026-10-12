<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Lien entre les objets Contravo (devis, facture, contrat) et les objets WINE,
// pour que les webhooks entrants sachent quelle opportunité / quel projet mettre à jour.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->string('contravo_quote_id')->nullable()->unique()->after('project_id');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->string('contravo_invoice_id')->nullable()->unique()->after('status');
            $table->string('contravo_contract_id')->nullable()->unique()->after('contravo_invoice_id');
        });
    }

    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropColumn('contravo_quote_id');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['contravo_invoice_id', 'contravo_contract_id']);
        });
    }
};
