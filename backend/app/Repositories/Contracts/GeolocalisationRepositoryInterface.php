<?php

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;

interface GeolocalisationRepositoryInterface
{
   
    public function autourDe(float $lat, float $lng, float $rayonKm, ?int $domaineId = null, int $limite = 100): Collection;
}