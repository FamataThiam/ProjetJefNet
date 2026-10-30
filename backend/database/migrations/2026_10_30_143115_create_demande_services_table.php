<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('demandes_service', function (Blueprint $table) {
        $table->id();
        $table->uuid('uuid')->unique();
        $table->foreignId('membre_id')->constrained('membres')->cascadeOnDelete();
        $table->foreignId('domaine_id')->constrained('domaines');
        $table->string('titre', 150);
        $table->text('description');
        $table->string('adresse');
        $table->decimal('latitude', 10, 7);
        $table->decimal('longitude', 10, 7);
        $table->foreignId('statut_id')->constrained('code_lists');
        $table->timestamps();

        // Accélère la recherche des demandes ouvertes d'un domaine
        $table->index(['domaine_id', 'statut_id']);
    });

    
    DB::statement('ALTER TABLE demandes_service ADD CONSTRAINT chk_coordonnees CHECK (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)');
}

public function down(): void
{
    Schema::dropIfExists('demandes_service');
}
};
