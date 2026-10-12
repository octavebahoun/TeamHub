<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->text('contravo_api_key')->nullable()->after('plan');
            $table->string('billing_name')->nullable()->after('contravo_api_key');
            $table->string('billing_city')->nullable()->after('billing_name');
            $table->string('billing_email')->nullable()->after('billing_city');
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['contravo_api_key', 'billing_name', 'billing_city', 'billing_email']);
        });
    }
};
