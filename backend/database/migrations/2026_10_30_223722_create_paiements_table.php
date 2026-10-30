<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
            public function up(): void
        {
            Schema::create('paiements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('reservation_id')->constrained('reservations');
                $table->decimal('montant', 12, 2);
                $table->foreignId('mode_id')->constrained('code_lists');
                $table->foreignId('statut_id')->constrained('code_lists');
                $table->string('reference_transaction', 100)->nullable()->unique();
                $table->timestamp('date_paiement')->nullable();
                $table->timestamps();

                $table->index('reservation_id');
            });

            
            DB::statement('ALTER TABLE paiements ADD CONSTRAINT chk_montant CHECK (montant > 0)');
        }

        public function down(): void
        {
            Schema::dropIfExists('paiements');
        }
};
