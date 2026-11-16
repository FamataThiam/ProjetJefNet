<?php

namespace Database\Seeders;

use App\Models\CodeList;
use Illuminate\Database\Seeder;

class CodeListSeeder extends Seeder
{
    public function run(): void
    {
        // Les valeurs sont définies une seule fois, dans le modèle CodeList.
        foreach (CodeList::VALEURS_SYSTEME as $type => $valeurs) {
            foreach ($valeurs as $valeur) {
                CodeList::updateOrCreate(
                    ['type' => $type, 'value' => $valeur],
                    ['active' => true]
                );
            }
        }
    }
}