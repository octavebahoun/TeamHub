<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// V1: posts stockés en Postgres (l'architecture prévoit Mongo pour la suite).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users');
            $table->text('body');
            $table->boolean('pinned')->default(false);
            $table->timestamp('pinned_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'pinned', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
