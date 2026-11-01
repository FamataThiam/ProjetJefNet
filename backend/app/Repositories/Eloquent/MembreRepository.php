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


        public function update(Membre $membre, array $data): Membre
    {
        $membre->update($data);

        return $membre->refresh();
    }


        public function trouverActifParUsername(string $username): ?Membre
    {
        return Membre::with('user')
            ->where('username', strtolower($username))
            ->whereHas('user.statutCompte', fn ($q) => $q->where('value', 'ACTIF'))
            ->first();
    }
}