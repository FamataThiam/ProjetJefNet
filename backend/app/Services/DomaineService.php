<?php

namespace App\Services;

use App\Repositories\Contracts\DomaineRepositoryInterface;
use Illuminate\Support\Collection;

class DomaineService
{
    public function __construct(private DomaineRepositoryInterface $domaines) {}

  
        public function lister(): Collection
    {
        return $this->domaines->tousAvecNombrePrestataires()
            ->where('est_actif', true)
            ->values();
    }
}