<?php

namespace Database\Factories;

use App\Services\CodeListService;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nom'               => fake('fr_FR')->lastName(),
            'prenom'            => fake('fr_FR')->firstName(),
            'email'             => fake()->unique()->safeEmail(),
            'password'          => 'password123',
            'provider'          => null,
            'provider_id'       => null,
            'statut_compte_id'  => app(CodeListService::class)->idOf('StatutCompte', 'ACTIF'),
            'est_email_verifie' => true,
            'remember_token'    => Str::random(10),
        ];
    }

    
    public function nonVerifie(): static
    {
        return $this->state(fn () => ['est_email_verifie' => false]);
    }

        public function externe(string $provider = 'google'): static
    {
        if (! in_array($provider, ['google', 'facebook', 'github'])) {
            throw new \InvalidArgumentException("Fournisseur non pris en charge : $provider");
        }

        return $this->state(fn () => [
            'password'    => null,
            'provider'    => $provider,
            'provider_id' => (string) fake()->unique()->randomNumber(9),
        ]);
    }
}