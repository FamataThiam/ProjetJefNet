<?php

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;

interface CodeListRepositoryInterface
{
    // Renvoie l'id d'une valeur d'une liste, ex : 'ModePaiement' => 'ESPECES'
    public function findId(string $type, string $value): ?int;

    // Renvoie toutes les valeurs d'une liste, ex : 'ModePaiement' => ['ESPECES', 'MOBILE_MONEY', 'CARTE', 'VIREMENT']
    public function activeByType(string $type): Collection;
}