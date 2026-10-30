<?php

namespace Database\Seeders;

use App\Models\Membre;
use App\Models\User;
use App\Services\CodeListService;
use Database\Seeders\Data\SenegalData;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Database\Seeders\Concerns\TirageAleatoire;

class UserSeeder extends Seeder
{

    use TirageAleatoire;
    public function __construct(private CodeListService $codeLists) {}

    public function run(): void
    {
        $this->creerAdministrateurs();
        $this->creerComptesDemo();
        $this->creerMembres(93);
    }


    private function creerAdministrateurs(): void
    {
        $niveaux = ['SUPER_ADMIN', 'ADMIN', 'ADMIN', 'MODERATEUR', 'MODERATEUR'];

        foreach ($niveaux as $i => $niveau) {
            $user = User::factory()->create([
                'prenom' => fake()->randomElement(SenegalData::PRENOMS_HOMMES),
                'nom'    => fake()->randomElement(SenegalData::NOMS),
                
                'email'  => $i === 0 ? 'admin@jefnet.test' : "admin{$i}@jefnet.test",
            ]);

            $user->administrateur()->create([
                'niveau_acces_id' => $this->codeLists->idOf('NiveauAcces', $niveau),
                'date_nomination' => fake()->dateTimeBetween('-1 year', '-1 month'),
            ]);
        }
    }

    
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


    private function creerMembres(int $nombre): void
    {
        for ($i = 0; $i < $nombre; $i++) {
            $genre  = fake()->randomElement(['femme', 'homme']);
            $prenom = fake()->randomElement($genre === 'femme' ? SenegalData::PRENOMS_FEMMES : SenegalData::PRENOMS_HOMMES);
            $nom    = fake()->randomElement(SenegalData::NOMS);

          
            $provider = $this->tirage(['email' => 70, 'google' => 15, 'facebook' => 10, 'github' => 5]);

            $factory = User::factory();
            if ($provider !== 'email') {
                $factory = $factory->externe($provider);
            }

            $user = $factory->create([
                'prenom'            => $prenom,
                'nom'               => $nom,
                'email'             => Str::slug("$prenom.$nom", '.') . fake()->unique()->numberBetween(1, 9999) . '@example.com',
                
                'statut_compte_id'  => $this->codeLists->idOf('StatutCompte', $this->tirage(['ACTIF' => 80, 'INACTIF' => 8, 'SIGNALE' => 7, 'BLOQUE' => 5])),
               
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

   

   
}