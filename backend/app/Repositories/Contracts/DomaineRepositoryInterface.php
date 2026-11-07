<?php

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;

interface DomaineRepositoryInterface
{
    public function tousAvecNombrePrestataires(): Collection;
}