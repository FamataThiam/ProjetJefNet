<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('motif_blocage', 500)->nullable();
            $table->timestamp('bloque_le')->nullable();
            $table->foreignId('bloque_par')->nullable()
                ->constrained('administrateurs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bloque_par');
            $table->dropColumn(['motif_blocage', 'bloque_le']);
        });
    }
};