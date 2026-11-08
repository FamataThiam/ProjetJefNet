<?php

namespace App\Support;

use Illuminate\Support\Str;

final class Zone
{

    public static function villesDeLaRegionDe(?string $ville): array
    {
        if (! $ville) {
            return [];
        }

        $cle = self::normaliser($ville);

        foreach (config('zones.regions') as $villes) {
            foreach ($villes as $v) {
                if (self::normaliser($v) === $cle) {
                    return $villes;
                }
            }
        }

        return [$ville]; 
    }

    private static function normaliser(string $texte): string
    {
        return Str::lower(Str::ascii(trim($texte)));
    }
}