<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('disponibilites', function (Blueprint $table) {
        $table->id();
        $table->foreignId('profil_professionnel_id')->constrained('profils_professionnels')->cascadeOnDelete();
        $table->date('jour_disponibilite');
        $table->time('heure_debut');
        $table->time('heure_fin');
        $table->boolean('est_disponible')->default(true);
        $table->timestamps();

        
        $table->index(['profil_professionnel_id', 'jour_disponibilite']);
    });

    
    DB::statement('ALTER TABLE disponibilites ADD CONSTRAINT chk_heures CHECK (heure_fin > heure_debut)');
}

public function down(): void
{
    Schema::dropIfExists('disponibilites');
}
};
