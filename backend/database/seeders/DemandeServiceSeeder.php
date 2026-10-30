<?php

namespace Database\Seeders;

use App\Models\DemandeService;
use App\Models\Domaine;
use App\Models\Membre;
use App\Services\CodeListService;
use Database\Seeders\Concerns\TirageAleatoire;
use Database\Seeders\Data\SenegalData;
use Illuminate\Database\Seeder;

class DemandeServiceSeeder extends Seeder
{
    use TirageAleatoire;

    public function __construct(private CodeListService $codeLists) {}

    public function run(): void
    {
        $domaines = Domaine::pluck('id', 'libelle');
        $actif    = $this->codeLists->idOf('StatutCompte', 'ACTIF');

        
        $membres = Membre::whereHas('user', fn ($q) => $q->where('statut_compte_id', $actif))->get();

       
        $fatou = $membres->first(fn ($m) => $m->user->email === 'client@jefnet.test');
        foreach (['Plomberie', 'Coiffure & beauté', 'Électricité'] as $domaine) {
            $this->creerDemande($fatou, $domaine, $domaines[$domaine], 'EN_ATTENTE');
        }

        
        for ($i = 0; $i < 57; $i++) {
            $domaine = fake()->randomElement(array_keys(SenegalData::DEMANDES));
            $statut  = $this->tirage(['EN_ATTENTE' => 50, 'CONCLUE' => 25, 'EXPIREE' => 10, 'ANNULEE' => 10, 'REFUSEE' => 5]);

            $this->creerDemande($membres->random(), $domaine, $domaines[$domaine], $statut);
        }
    }

    private function creerDemande(Membre $membre, string $domaine, int $domaineId, string $statut): void
    {
        [$titre, $description] = fake()->randomElement(SenegalData::DEMANDES[$domaine]);

        // Le lieu : le quartier du membre, avec un petit décalage (environ 400 m)
        [$lat, $lng] = SenegalData::COORDONNEES[$membre->localite] ?? SenegalData::COORDONNEES['Médina'];
        $lat += fake()->randomFloat(5, -0.004, 0.004);
        $lng += fake()->randomFloat(5, -0.004, 0.004);

        // La date dépend du statut : récente si en attente, ancienne si expirée
        $date = match ($statut) {
            'EN_ATTENTE' => fake()->dateTimeBetween('-7 days', 'now'),
            'EXPIREE'    => fake()->dateTimeBetween('-45 days', '-16 days'),
            default      => fake()->dateTimeBetween('-30 days', '-2 days'),
        };

        $demande = DemandeService::create([
            'membre_id'   => $membre->id,
            'domaine_id'  => $domaineId,
            'titre'       => $titre,
            'description' => $description,
            'adresse'     => fake()->numberBetween(1, 250) . ', ' . $membre->localite . ', ' . $membre->ville,
            'latitude'    => $lat,
            'longitude'   => $lng,
            'statut_id'   => $this->codeLists->idOf('StatutDemande', $statut),
        ]);


        $demande->timestamps = false;
        $demande->forceFill(['created_at' => $date, 'updated_at' => $date])->save();
    }
}