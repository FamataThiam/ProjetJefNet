<?php

namespace App\Repositories\Eloquent;

use App\Models\Membre;
use App\Repositories\Contracts\MembreRepositoryInterface;

class MembreRepository implements MembreRepositoryInterface
{
    public function create(array $data): Membre
    {
        return Membre::create($data);
    }
}