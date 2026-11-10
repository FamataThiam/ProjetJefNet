<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profils_professionnels', function (Blueprint $table) {
            // Position de travail du prestataire (point de départ des interventions)
            $table->decimal('latitude', 9, 6)->nullable();
            $table->decimal('longitude', 9, 6)->nullable();
            $table->timestamp('position_maj_le')->nullable();

            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::table('profils_professionnels', function (Blueprint $table) {
            $table->dropIndex(['latitude', 'longitude']);
            $table->dropColumn(['latitude', 'longitude', 'position_maj_le']);
        });
    }
};