<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('code', 12);
            $table->string('title');
            $table->boolean('done')->default(false);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('project_deliverables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('status')->default('submitted');
            $table->unsignedInteger('version')->default(1);
            $table->string('file_name')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('client_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('channel', 20);
            $table->string('display_name');
            $table->string('identifier_label')->nullable();
            $table->timestamps();
        });

        Schema::create('client_conversation_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_id')->constrained('client_conversations')->cascadeOnDelete();
            $table->string('sender', 20);
            $table->text('body');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('client_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->string('submitted_by_name');
            $table->timestamp('submitted_at');
            $table->timestamps();
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->string('kind', 40)->nullable()->after('body');
            $table->json('meta')->nullable()->after('kind');
        });

        Schema::table('billing_payments', function (Blueprint $table) {
            $table->string('channel', 32)->nullable()->after('method');
        });

        Schema::table('billing_contracts', function (Blueprint $table) {
            $table->string('signature_token', 64)->nullable()->unique()->after('signed_at');
            $table->string('signer_name')->nullable()->after('signature_token');
            $table->string('signer_email')->nullable()->after('signer_name');
        });
    }

    public function down(): void
    {
        Schema::table('billing_contracts', function (Blueprint $table) {
            $table->dropColumn(['signature_token', 'signer_name', 'signer_email']);
        });
        Schema::table('billing_payments', function (Blueprint $table) {
            $table->dropColumn('channel');
        });
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['kind', 'meta']);
        });
        Schema::dropIfExists('client_reviews');
        Schema::dropIfExists('client_conversation_messages');
        Schema::dropIfExists('client_conversations');
        Schema::dropIfExists('project_deliverables');
        Schema::dropIfExists('project_milestones');
    }
};
