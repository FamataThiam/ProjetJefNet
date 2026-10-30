<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('notifications', function (Blueprint $table) {
        $table->id();
        $table->foreignId('membre_id')->constrained('membres')->cascadeOnDelete();
        $table->foreignId('type_id')->constrained('code_lists');
        $table->string('titre', 150);
        $table->text('contenu');
        $table->string('lien')->nullable();      
        $table->boolean('est_lu')->default(false);
        $table->timestamps();

        $table->index(['membre_id', 'est_lu']);   
    });
}

public function down(): void
{
    Schema::dropIfExists('notifications');
}
};
