<?php

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;

interface RecommandationRepositoryInterface
{
    
    public function candidats(?float $lat, ?float $lng, ?int $domaineId, ?int $exclureMembreId): Collection;
}