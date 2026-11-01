<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;

class UserRepository implements UserRepositoryInterface
{
    public function findByEmail(string $email): ?User
    {
        return User::where('email', strtolower($email))->first();
    }

    public function findByProvider(string $provider, string $providerId): ?User
    {
        return User::where('provider', $provider)->where('provider_id', $providerId)->first();
    }

    public function create(array $data): User
    {
        $data['email'] = strtolower($data['email']);
        return User::create($data);
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);
        return $user->refresh();
    }

        public function enregistrerConnexion(User $user): void
    {
        $user->membre?->increment('nombre_connexion', 1, [
            'derniere_connexion' => now(),
        ]);
    }

        public function supprimerTousLesJetons(User $user): void
    {
        $user->tokens()->delete();
    }


        public function supprimerAutresJetons(User $user, int $jetonAGarderId): void
    {
        $user->tokens()->where('id', '!=', $jetonAGarderId)->delete();
    }
}