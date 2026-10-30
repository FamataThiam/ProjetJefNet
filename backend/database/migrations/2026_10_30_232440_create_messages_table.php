<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignId('expediteur_id')->constrained('membres')->cascadeOnDelete();
            $table->foreignId('reponse_a_id')->nullable()->constrained('messages')->nullOnDelete();
            $table->text('contenu')->nullable();
            $table->foreignId('type_message_id')->constrained('code_lists');
            $table->string('fichier_url')->nullable();
            $table->boolean('est_lu')->default(false);
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']); 
        });

        
        DB::statement('ALTER TABLE messages ADD CONSTRAINT chk_contenu_ou_fichier CHECK (contenu IS NOT NULL OR fichier_url IS NOT NULL)');
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
