<?php

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

        // Données existantes : on prend la date de création du profil.
        // Sur une base neuve (Docker), les CodeList ne sont pas encore remplies : rien à mettre à jour.
        $statuts = DB::table('code_lists')
            ->where('type', 'StatutProfil')
            ->whereIn('value', ['EN_ATTENTE', 'CERTIFIE', 'REFUSE'])
            ->pluck('id');

        if ($statuts->isNotEmpty()) {
            DB::table('profils_professionnels')
                ->whereIn('statut_certification_id', $statuts)
                ->update(['certification_demandee_le' => DB::raw('created_at')]);
        }
    }

    public function down(): void
    {
        Schema::table('profils_professionnels', function (Blueprint $table) {
            $table->dropColumn('certification_demandee_le');
        });
    }
};