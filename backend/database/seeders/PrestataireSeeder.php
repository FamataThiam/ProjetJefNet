<?php

namespace Database\Seeders;

use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Models\User;
use App\Services\CodeListService;
use Database\Seeders\Concerns\TirageAleatoire;
use Database\Seeders\Data\SenegalData;
use Illuminate\Database\Seeder;

class PrestataireSeeder extends Seeder
{
    use TirageAleatoire;

    public function __construct(private CodeListService $codeLists) {}

    public function run(): void
    {
        $this->creerPrestataireDemo();
        $this->creerPrestataires(34);
    }

    
    private function creerPrestataireDemo(): void
    {
        $membre = User::where('email', 'prestataire@jefnet.test')->first()->membre;

        ProfilProfessionnel::updateOrCreate(
            ['membre_id' => $membre->id],
            ProfilProfessionnel::factory()->dansDomaine('Plomberie')->certification('CERTIFIE')->raw([
                'membre_id'           => $membre->id,
                'titre_professionnel' => 'Plombier',
                'note_moyenne'        => 0,
            ])
        );
    }

    private function creerPrestataires(int $nombre): void
    {
        $actif = $this->codeLists->idOf('StatutCompte', 'ACTIF');


        $membres = Membre::whereDoesntHave('profilProfessionnel')
            ->whereHas('user', fn ($q) => $q->where('statut_compte_id', $actif)
                                             ->where('email', '!=', 'client@jefnet.test'))
            ->inRandomOrder()
            ->limit($nombre)
            ->get();

        
        $domaines = array_keys(SenegalData::METIERS);

        foreach ($membres as $i => $membre) {
            $domaine = $domaines[$i % count($domaines)];

            
            $statut = $this->tirage(['NON_CERTIFIE' => 45, 'CERTIFIE' => 35, 'EN_ATTENTE' => 12, 'REFUSE' => 5, 'RETIRE' => 3]);

            ProfilProfessionnel::factory()
                ->dansDomaine($domaine, SenegalData::genreDe($membre->user->prenom))
                ->certification($statut)
                ->create(['membre_id' => $membre->id]);
        }
    }
}