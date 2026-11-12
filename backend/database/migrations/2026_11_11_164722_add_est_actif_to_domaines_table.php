<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domaines', function (Blueprint $table) {
            // Tous les domaines existants restent actifs
            $table->boolean('est_actif')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('domaines', function (Blueprint $table) {
            $table->dropColumn('est_actif');
        });
    }
};