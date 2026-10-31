<?php

namespace App\Repositories\Contracts;

use App\Models\User;

interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;

    public function findByProvider(string $provider, string $providerId): ?User;

    public function create(array $data): User;

    public function update(User $user, array $data): User;

    public function enregistrerConnexion(User $user): void;

    public function supprimerTousLesJetons(User $user): void;
}