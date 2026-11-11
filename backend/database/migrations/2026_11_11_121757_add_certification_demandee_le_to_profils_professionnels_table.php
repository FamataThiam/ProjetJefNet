<?php

use App\Support\CodeListe;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profils_professionnels', function (Blueprint $table) {
            $table->timestamp('certification_demandee_le')->nullable();
        });

        // Données existantes : on prend la date de création du profil
        DB::table('profils_professionnels')
            ->whereIn('statut_certification_id', [
                CodeListe::id('StatutProfil', 'EN_ATTENTE'),
                CodeListe::id('StatutProfil', 'CERTIFIE'),
                CodeListe::id('StatutProfil', 'REFUSE'),
            ])
            ->update(['certification_demandee_le' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        Schema::table('profils_professionnels', function (Blueprint $table) {
            $table->dropColumn('certification_demandee_le');
        });
    }
};