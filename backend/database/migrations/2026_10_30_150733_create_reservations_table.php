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
    Schema::create('reservations', function (Blueprint $table) {
        $table->id();
        $table->uuid('uuid')->unique();
        $table->foreignId('membre_id')->constrained('membres');                           // le client
        $table->foreignId('profil_professionnel_id')->constrained('profils_professionnels'); // le prestataire
        $table->foreignId('demande_service_id')->nullable()->unique()->constrained('demandes_service');
        $table->date('date_prevue');
        $table->time('heure_prevue');
        $table->string('adresse_intervention');
        $table->decimal('prix_final', 12, 2)->default(0);
        $table->foreignId('statut_id')->constrained('code_lists');
        $table->timestamp('date_confirmation')->nullable();
        $table->timestamp('date_annulation')->nullable();
        $table->string('raison_annulation')->nullable();
        $table->timestamps();

        $table->index(['profil_professionnel_id', 'date_prevue']);   // le planning d'un prestataire
        $table->index('membre_id');                                  // les réservations d'un client
    });

  
    DB::statement('ALTER TABLE reservations ADD CONSTRAINT chk_prix_final CHECK (prix_final >= 0)');
   
    DB::statement('ALTER TABLE reservations ADD CONSTRAINT chk_motif_annulation CHECK (date_annulation IS NULL OR raison_annulation IS NOT NULL)');
}

        public function down(): void
        {
            Schema::dropIfExists('reservations');
        }
};
