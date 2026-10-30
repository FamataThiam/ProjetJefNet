<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('conversations', function (Blueprint $table) {
        $table->id();
        $table->uuid('uuid')->unique();
        $table->foreignId('initiateur_id')->constrained('membres')->cascadeOnDelete();
        $table->foreignId('destinataire_id')->constrained('membres')->cascadeOnDelete();
        $table->foreignId('statut_id')->constrained('code_lists');
        $table->timestamps();
    });

  
    DB::statement('ALTER TABLE conversations ADD CONSTRAINT chk_membres_distincts CHECK (initiateur_id <> destinataire_id)');

  // LEAST permet de toujours avoir l'ID le plus petit en premier, et GREATEST l'ID le plus grand en second, ce qui permet d'éviter les doublons (A,B) et (B,A)
    DB::statement('CREATE UNIQUE INDEX conversations_paire_unique ON conversations (LEAST(initiateur_id, destinataire_id), GREATEST(initiateur_id, destinataire_id))');
}

public function down(): void
{
    Schema::dropIfExists('conversations');
}
};
