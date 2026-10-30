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
    Schema::create('details_reservation', function (Blueprint $table) {
        $table->id();
        $table->foreignId('reservation_id')->constrained('reservations')->cascadeOnDelete();
        $table->foreignId('service_id')->constrained('services');
        $table->decimal('prix_service', 10, 2);
        $table->timestamps();

      
        $table->unique(['reservation_id', 'service_id']);
    });

    DB::statement('ALTER TABLE details_reservation ADD CONSTRAINT chk_prix_service CHECK (prix_service >= 0)');
}

public function down(): void
{
    Schema::dropIfExists('details_reservation');
}
};
