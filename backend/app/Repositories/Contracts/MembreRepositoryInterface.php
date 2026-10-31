<?php

namespace App\Repositories\Contracts;

use App\Models\Membre;

interface MembreRepositoryInterface
{
    public function create(array $data): Membre;
}