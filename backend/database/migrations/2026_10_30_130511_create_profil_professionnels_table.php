<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('profils_professionnels', function (Blueprint $table) {
        $table->id();
        $table->foreignId('membre_id')->unique()->constrained('membres')->cascadeOnDelete();
        $table->string('titre_professionnel', 150);
        $table->string('experience', 100)->nullable();
        $table->string('cv')->nullable();
        $table->string('linkedin')->nullable();
        $table->string('portfolio')->nullable();
        $table->foreignId('rayon_intervention_id')->constrained('code_lists');
        $table->foreignId('statut_certification_id')->constrained('code_lists');
        $table->decimal('note_moyenne', 3, 2)->default(0);
        $table->text('biographie')->nullable();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('profils_professionnels');
}

    /**
     * Reverse the migrations.
     */
    
};
