<?php

namespace App\Repositories\Contracts;

use App\Models\Membre;

interface MembreRepositoryInterface
{
    public function create(array $data): Membre;
    public function update(Membre $membre, array $data): Membre;
    public function trouverActifParUsername(string $username): ?Membre;
}