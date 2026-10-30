<?php

namespace Database\Seeders\Concerns;

trait TirageAleatoire
{
   
    protected function tirage(array $poids): string
    {
        $n = fake()->numberBetween(1, array_sum($poids));
        foreach ($poids as $valeur => $p) {
            if ($n <= $p) {
                return $valeur;
            }
            $n -= $p;
        }
        return array_key_first($poids);
    }
}