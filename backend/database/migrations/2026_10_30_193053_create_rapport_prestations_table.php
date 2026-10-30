<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('rapports_prestation', function (Blueprint $table) {
        $table->id();
        $table->foreignId('reservation_id')->unique()->constrained('reservations');
        $table->text('description_prestation');
        $table->text('observations')->nullable();
        $table->string('photos_avant')->nullable();
        $table->string('photos_apres')->nullable();
        $table->timestamp('date_signature_client')->nullable();
        $table->timestamp('date_signature_prestataire')->nullable();
        $table->foreignId('statut_rapport_id')->constrained('code_lists');
        $table->string('fichier_pdf')->nullable();
        $table->timestamps();
    });

    
    DB::statement('ALTER TABLE rapports_prestation ADD CONSTRAINT chk_pdf_signe CHECK (fichier_pdf IS NULL OR (date_signature_client IS NOT NULL AND date_signature_prestataire IS NOT NULL))');
}

    public function down(): void
    {
        Schema::dropIfExists('rapports_prestation');
    }
};
