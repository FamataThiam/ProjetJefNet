<?php

namespace Database\Seeders;

use App\Models\Domaine;
use App\Models\ProfilProfessionnel;
use App\Models\Service;
use Database\Seeders\Data\SenegalData;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
    
        $domaines = Domaine::pluck('id', 'libelle');

        foreach (ProfilProfessionnel::with('membre.user')->get() as $profil) {
            $domaine = SenegalData::domaineDuTitre($profil->titre_professionnel);
            if (! $domaine) {
                continue;   
            }

            $catalogue = SenegalData::CATALOGUE[$domaine];
            $estDemo   = $profil->membre->user->email === 'prestataire@jefnet.test';

            
            $nombre = $estDemo ? count($catalogue) : min(fake()->numberBetween(2, 4), count($catalogue));
            $choix  = (array) array_rand($catalogue, $nombre);

            foreach ($choix as $index) {
                [$nom, $prixMin, $prixMax, $duree, $unite] = $catalogue[$index];

                Service::create([
                    'profil_professionnel_id' => $profil->id,
                    'domaine_id'              => $domaines[$domaine],
                    'nom'                     => $nom,
                    'description'             => "$nom réalisé(e) par un(e) professionnel(le) de " . $profil->membre->ville . '. Matériel fourni, travail soigné.',
                    'prix'                    => round(fake()->numberBetween($prixMin, $prixMax) / 500) * 500,   // arrondi à 500 FCFA
                    'duree'                   => $duree,
                    'unite_tarif'             => $unite,
                    'est_actif'               => $estDemo || fake()->boolean(90),   // 10 % désactivés
                ]);
            }
        }
    }
}