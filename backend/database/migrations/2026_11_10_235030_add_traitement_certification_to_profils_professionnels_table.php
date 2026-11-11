<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profils_professionnels', function (Blueprint $table) {
          
            $table->foreignId('certification_traitee_par')->nullable()
                ->constrained('administrateurs')->nullOnDelete();
            $table->timestamp('certification_traitee_le')->nullable();
            $table->string('motif_refus', 500)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('profils_professionnels', function (Blueprint $table) {
            $table->dropConstrainedForeignId('certification_traitee_par');
            $table->dropColumn(['certification_traitee_le', 'motif_refus']);
        });
    }
};