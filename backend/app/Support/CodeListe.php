<?php

namespace App\Support;

use App\Models\CodeList;
use RuntimeException;

final class CodeListe
{
    // Retrouve l'id d'une valeur de CodeList (ex. StatutDemande / EN_ATTENTE)
    public static function id(string $type, string $value): int
    {
        return CodeList::where('type', $type)->where('value', $value)->value('id')
            ?? throw new RuntimeException("Valeur CodeList introuvable : {$type}/{$value}");
    }
}