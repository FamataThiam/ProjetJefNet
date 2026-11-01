<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\MembreRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class MembreService
{
    public function __construct(private MembreRepositoryInterface $membres) {}

    
    public function profilPublic(string $username): User
    {
        $membre = $this->membres->trouverActifParUsername($username);

        if (! $membre) {
            throw new ModelNotFoundException('Membre introuvable.');
        }

        return $membre->user->setRelation('membre', $membre);
    }
}