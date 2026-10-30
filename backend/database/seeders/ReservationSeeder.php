<?php

namespace Database\Seeders;

use App\Models\DemandeService;
use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Models\Reservation;
use App\Models\User;
use App\Services\CodeListService;
use Carbon\Carbon;
use Database\Seeders\Concerns\TirageAleatoire;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class ReservationSeeder extends Seeder
{
    use TirageAleatoire;

    private const HEURES = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    private const MOTIFS = [
        'Empêchement de dernière minute',
        'J\'ai trouvé une autre solution',
        'Changement de date de la cérémonie',
        'Le prestataire n\'était plus disponible',
        'Voyage imprévu',
    ];

    private Collection $prestataires;

    public function __construct(private CodeListService $codeLists) {}

    public function run(): void
    {
       
        $this->prestataires = ProfilProfessionnel::with(['services' => fn ($q) => $q->where('est_actif', true)])
            ->get()
            ->filter(fn ($p) => $p->services->isNotEmpty());

        $this->reservationsDemo();
        $this->reservationsDepuisDemandes();
        $this->reservationsDirectes(80);
    }

   
    private function reservationsDemo(): void
    {
        $fatou  = User::where('email', 'client@jefnet.test')->first()->membre;
        $moussa = User::where('email', 'prestataire@jefnet.test')->first()->membre->profilProfessionnel;
        $moussa = $this->prestataires->firstWhere('id', $moussa->id);

        foreach (['TERMINEE', 'CONFIRMEE', 'EN_ATTENTE'] as $statut) {
            $this->creer($fatou, $moussa, $moussa->services->random(fake()->numberBetween(1, 2)), $statut);
        }
    }

  
    private function reservationsDepuisDemandes(): void
    {
        $conclue  = $this->codeLists->idOf('StatutDemande', 'CONCLUE');
        $demandes = DemandeService::with('membre')->where('statut_id', $conclue)->get();

        foreach ($demandes as $demande) {
            // Un prestataire qui propose des services dans le domaine de la demande (et qui n'est pas l'auteur)
            $candidats = $this->prestataires->filter(fn ($p) =>
                $p->membre_id !== $demande->membre_id
                && $p->services->contains('domaine_id', $demande->domaine_id));

            if ($candidats->isEmpty()) {
                continue;
            }

            $prestataire = $candidats->random();
            $services    = $prestataire->services->where('domaine_id', $demande->domaine_id);
            $statut      = $this->tirage(['TERMINEE' => 50, 'CONFIRMEE' => 30, 'EN_COURS' => 20]);

            $this->creer($demande->membre, $prestataire, $services->random(1), $statut, $demande);
        }
    }


    private function reservationsDirectes(int $nombre): void
    {
        $actif   = $this->codeLists->idOf('StatutCompte', 'ACTIF');
        $clients = Membre::whereHas('user', fn ($q) => $q->where('statut_compte_id', $actif))->get();

        for ($i = 0; $i < $nombre; $i++) {
            $client = $clients->random();

            // Règle : un membre ne peut pas réserver ses propres services
            $prestataire = $this->prestataires->where('membre_id', '!=', $client->id)->random();

            $nbServices = min(fake()->numberBetween(1, 2), $prestataire->services->count());
            $statut     = $this->tirage(['TERMINEE' => 35, 'CONFIRMEE' => 20, 'EN_ATTENTE' => 20, 'EN_COURS' => 5, 'ANNULEE' => 15, 'REFUSEE' => 5]);

            $this->creer($client, $prestataire, $prestataire->services->random($nbServices), $statut);
        }
    }

    private function creer(Membre $client, ProfilProfessionnel $prestataire, Collection $services, string $statut, ?DemandeService $demande = null): void
    {
      
        $datePrevue = match ($statut) {
            'TERMINEE' => Carbon::instance(fake()->dateTimeBetween('-30 days', '-1 day')),
            'EN_COURS' => now(),
            'ANNULEE', 'REFUSEE' => Carbon::instance(fake()->dateTimeBetween('-20 days', '+10 days')),
            default    => Carbon::instance(fake()->dateTimeBetween('+1 day', '+14 days')),
        };

     
        $creation = $datePrevue->copy()->subDays(fake()->numberBetween(2, 7));
        if ($demande && $creation->lt($demande->created_at)) {
            $creation = $demande->created_at->copy()->addHours(fake()->numberBetween(1, 24));
        }

        $confirmee = in_array($statut, ['CONFIRMEE', 'EN_COURS', 'TERMINEE']);
        $annulee   = $statut === 'ANNULEE';

        $reservation = Reservation::create([
            'membre_id'               => $client->id,
            'profil_professionnel_id' => $prestataire->id,
            'demande_service_id'      => $demande?->id,
            'date_prevue'             => $datePrevue->toDateString(),
            'heure_prevue'            => fake()->randomElement(self::HEURES),
            'adresse_intervention'    => $demande?->adresse ?? fake()->numberBetween(1, 250) . ', ' . $client->localite . ', ' . $client->ville,
            'statut_id'               => $this->codeLists->idOf('StatutReservation', $statut),
            'date_confirmation'       => $confirmee ? $creation->copy()->addHours(fake()->numberBetween(1, 30)) : null,
            'date_annulation'         => $annulee ? $creation->copy()->addDay() : null,
            'raison_annulation'       => $annulee ? fake()->randomElement(self::MOTIFS) : null,
        ]);

        foreach ($services as $service) {
            $reservation->details()->create([
                'service_id'   => $service->id,
                'prix_service' => $service->prix,
            ]);
        }

       
        $reservation->prix_final = $reservation->calculerPrixTotal();
        $reservation->timestamps = false;
        $reservation->created_at = $creation;
        $reservation->updated_at = $creation;
        $reservation->save();
    }
}