<?php

namespace Database\Factories;

use App\Models\User;
use Database\Seeders\Data\SenegalData;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class MembreFactory extends Factory
{
    public function definition(): array
    {
        // 60 % des membres à Dakar, les autres répartis dans les autres villes
        $ville = fake()->boolean(60)
            ? 'Dakar'
            : fake()->randomElement(array_keys(SenegalData::VILLES));

        return [
            'user_id'            => User::factory(),
            'username'           => fake()->unique()->userName(),
            'telephone'          => fake()->randomElement(SenegalData::PREFIXES_TEL) . fake()->numerify('#######'),
            'ville'              => $ville,
            'localite'           => fake()->randomElement(SenegalData::VILLES[$ville]),
            'pays'               => 'Sénégal',
            'derniere_connexion' => fake()->dateTimeBetween('-30 days', 'now'),
            'nombre_connexion'   => fake()->numberBetween(1, 120),
            'photo_profil_path'  => null,
            'couleur_perso'      => fake()->randomElement(['#0174AB', '#0E9F6E', '#B45309', '#7C3AED', '#DB2777', '#0F766E']),
            'signature_electronique' => null,
        ];
    }

    // Le nom d'utilisateur est fabriqué à partir du prénom et du nom : "fatou.ndiaye42"
    public function pourUser(User $user): static
    {
        return $this->state(fn () => [
            'user_id'  => $user->id,
            'username' => Str::slug($user->prenom . '.' . $user->nom, '.') . fake()->unique()->numberBetween(1, 999),
        ]);
    }

    // Une photo de profil qui correspond au genre ('femme' ou 'homme')
    public function avecPhoto(string $genre): static
    {
        $max = $genre === 'femme' ? SenegalData::NB_AVATARS_FEMMES : SenegalData::NB_AVATARS_HOMMES;
        $numero = str_pad(fake()->numberBetween(1, $max), 2, '0', STR_PAD_LEFT);

        return $this->state(fn () => [
            'photo_profil_path' => "avatars/{$genre}-{$numero}.jpg",
        ]);
    }

    // La signature qui correspond au nom de famille : "signatures/signature-ndiaye.png"
    public function avecSignature(string $nom): static
    {
        return $this->state(fn () => [
            'signature_electronique' => 'signatures/signature-' . Str::slug($nom) . '.png',
        ]);
    }
}