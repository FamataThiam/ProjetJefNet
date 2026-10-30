<?php

namespace Database\Seeders;

use App\Models\Membre;
use App\Models\User;
use App\Services\CodeListService;
use Database\Seeders\Data\SenegalData;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function __construct(private CodeListService $codeLists) {}

    public function run(): void
    {
        $this->creerAdministrateurs();
        $this->creerComptesDemo();
        $this->creerMembres(93);
    }

    // 5 administrateurs : 1 SUPER_ADMIN, 2 ADMIN, 2 MODERATEUR
    private function creerAdministrateurs(): void
    {
        $niveaux = ['SUPER_ADMIN', 'ADMIN', 'ADMIN', 'MODERATEUR', 'MODERATEUR'];

        foreach ($niveaux as $i => $niveau) {
            $user = User::factory()->create([
                'prenom' => fake()->randomElement(SenegalData::PRENOMS_HOMMES),
                'nom'    => fake()->randomElement(SenegalData::NOMS),
                // Le premier a un e-mail fixe pour pouvoir se connecter facilement
                'email'  => $i === 0 ? 'admin@jefnet.test' : "admin{$i}@jefnet.test",
            ]);

            $user->administrateur()->create([
                'niveau_acces_id' => $this->codeLists->idOf('NiveauAcces', $niveau),
                'date_nomination' => fake()->dateTimeBetween('-1 year', '-1 month'),
            ]);
        }
    }

    // 2 comptes membres connus, pour les démonstrations
    private function creerComptesDemo(): void
    {
        $demos = [
            ['prenom' => 'Fatou',   'nom' => 'Ndiaye', 'email' => 'client@jefnet.test',      'genre' => 'femme'],
            ['prenom' => 'Moussa',  'nom' => 'Diop',   'email' => 'prestataire@jefnet.test', 'genre' => 'homme'],
        ];

        foreach ($demos as $d) {
            $user = User::factory()->create(['prenom' => $d['prenom'], 'nom' => $d['nom'], 'email' => $d['email']]);

            Membre::factory()
                ->pourUser($user)
                ->avecPhoto($d['genre'])
                ->avecSignature($d['nom'])
                ->create(['ville' => 'Dakar', 'localite' => 'Médina']);
        }
    }

    // Les autres membres, avec des données variées
    private function creerMembres(int $nombre): void
    {
        for ($i = 0; $i < $nombre; $i++) {
            $genre  = fake()->randomElement(['femme', 'homme']);
            $prenom = fake()->randomElement($genre === 'femme' ? SenegalData::PRENOMS_FEMMES : SenegalData::PRENOMS_HOMMES);
            $nom    = fake()->randomElement(SenegalData::NOMS);

            // Mode d'inscription : 70 % e-mail, 15 % Google, 10 % Facebook, 5 % GitHub
            $provider = $this->tirage(['email' => 70, 'google' => 15, 'facebook' => 10, 'github' => 5]);

            $factory = User::factory();
            if ($provider !== 'email') {
                $factory = $factory->externe($provider);
            }

            $user = $factory->create([
                'prenom'            => $prenom,
                'nom'               => $nom,
                'email'             => Str::slug("$prenom.$nom", '.') . fake()->unique()->numberBetween(1, 9999) . '@example.com',
                // Répartition des statuts : 80 % ACTIF, 8 % INACTIF, 7 % SIGNALE, 5 % BLOQUE
                'statut_compte_id'  => $this->codeLists->idOf('StatutCompte', $this->tirage(['ACTIF' => 80, 'INACTIF' => 8, 'SIGNALE' => 7, 'BLOQUE' => 5])),
                // Un compte externe est toujours vérifié ; sinon 90 % vérifiés
                'est_email_verifie' => $provider !== 'email' || fake()->boolean(90),
            ]);

            $membre = Membre::factory()->pourUser($user);

            if (fake()->boolean(60)) {
                $membre = $membre->avecPhoto($genre);       // 60 % ont une photo
            }
            if (fake()->boolean(40)) {
                $membre = $membre->avecSignature($nom);     // 40 % ont une signature
            }

            $membre->create();
        }
    }

    // Tire une valeur au hasard selon des pourcentages, ex : ['ACTIF' => 80, 'BLOQUE' => 20]
    private function tirage(array $poids): string
    {
        $n = fake()->numberBetween(1, array_sum($poids));
        foreach ($poids as $valeur => $p) {
            if ($n <= $p) {
                return $valeur;
            }
            $n -= $p;
        }
        return array_key_first($poids);
    }
}