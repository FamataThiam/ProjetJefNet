<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ajout des colonnes (vides pour l'instant)
        Schema::table('demandes_service', function (Blueprint $table) {
            $table->string('ville', 100)->nullable()->after('adresse');
            $table->string('localite', 100)->nullable()->after('ville');
            $table->index('ville');   // la recherche des demandes par zone filtre sur la ville
        });

        // 2. Les demandes déjà en base reprennent la ville et la localité de leur client
        DB::statement("
            UPDATE demandes_service d
            SET ville    = COALESCE(m.ville, 'Dakar'),
                localite = m.localite
            FROM membres m
            WHERE m.id = d.membre_id
        ");

        // 3. La ville devient obligatoire (la localité reste facultative)
        DB::statement('ALTER TABLE demandes_service ALTER COLUMN ville SET NOT NULL');
    }

    public function down(): void
    {
        Schema::table('demandes_service', function (Blueprint $table) {
            $table->dropIndex(['ville']);
            $table->dropColumn(['ville', 'localite']);
        });
    }
};