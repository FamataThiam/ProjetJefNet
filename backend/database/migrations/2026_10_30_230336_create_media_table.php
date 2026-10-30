<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
            public function up(): void
        {
            Schema::create('medias', function (Blueprint $table) {
                $table->id();
                $table->foreignId('publication_id')->constrained('publications')->cascadeOnDelete();
                $table->foreignId('type_id')->constrained('code_lists');   
                $table->string('url');
                $table->unsignedTinyInteger('ordre')->default(1);          
                $table->timestamps();
            });
        }

        public function down(): void
        {
            Schema::dropIfExists('medias');
        }
};
