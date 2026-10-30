<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
            public function up(): void
        {
            Schema::create('commentaires_publication', function (Blueprint $table) {
                $table->id();
                $table->foreignId('publication_id')->constrained('publications')->cascadeOnDelete();
                $table->foreignId('membre_id')->constrained('membres')->cascadeOnDelete();
                $table->foreignId('parent_id')->nullable()->constrained('commentaires_publication')->cascadeOnDelete();
                $table->string('contenu', 1000);
                $table->timestamps();

                $table->index(['publication_id', 'created_at']);
            });

        
            DB::statement('ALTER TABLE commentaires_publication ADD CONSTRAINT chk_pas_soi_meme CHECK (parent_id IS NULL OR parent_id <> id)');
        }

        public function down(): void
        {
            Schema::dropIfExists('commentaires_publication');
        }
};
