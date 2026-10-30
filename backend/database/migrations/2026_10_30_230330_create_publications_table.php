<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('publications', function (Blueprint $table) {
        $table->id();
        $table->foreignId('profil_professionnel_id')->constrained('profils_professionnels')->cascadeOnDelete();
        $table->string('titre', 150);
        $table->text('description');
        $table->timestamp('date_publication')->useCurrent();
        $table->boolean('est_active')->default(true);   
        $table->timestamps();

        $table->index(['est_active', 'date_publication']);  
    });
}

public function down(): void
{
    Schema::dropIfExists('publications');
}
};
