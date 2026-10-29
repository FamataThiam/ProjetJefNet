<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('membres', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
        $table->string('username', 50)->unique();
        $table->string('telephone', 20)->nullable();
        $table->string('ville', 100)->nullable();
        $table->string('localite', 100)->nullable();
        $table->string('pays', 100)->default('Sénégal');
        $table->timestamp('derniere_connexion')->nullable();
        $table->unsignedInteger('nombre_connexion')->default(0);
        $table->string('photo_profil_path')->nullable();
        $table->string('couleur_perso', 7)->nullable();
        $table->string('signature_electronique')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membres');
    }
};
