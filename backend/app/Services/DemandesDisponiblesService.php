<?php

namespace App\Services;

use App\Exceptions\DemandeException;
use App\Exceptions\ProfilProException;
use App\Models\DemandeService;
use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Models\Reservation;
use App\Repositories\Contracts\DemandeServiceRepositoryInterface;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use App\Support\CodeListe;
use App\Support\Zone;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DemandesDisponiblesService
{
    public function __construct(
        private DemandeServiceRepositoryInterface $demandes,
        private ProfilProfessionnelRepositoryInterface $profils,
        private ReservationRepositoryInterface $reservations,
        private NotificationService $notifications,
    ) {}

    public function lister(Membre $membre): LengthAwarePaginator
    {
        return $this->demandes->disponibles($this->criteres($membre, $this->profilDe($membre)));
    }

    public function consulter(Membre $membre, string $uuid): DemandeService
    {
        return $this->demandes->trouverDisponible($this->criteres($membre, $this->profilDe($membre)), $uuid);
    }

   
    public function accepter(Membre $membre, string $uuid, array $donnees): Reservation
    {
        $profil  = $this->profilDe($membre);
        $demande = $this->demandes->trouverDisponible($this->criteres($membre, $profil), $uuid);

         
        $service = $profil->services()
            ->where('id', $donnees['service_id'])
            ->where('est_actif', true)
            ->first();

        if (! $service || (int) $service->domaine_id !== (int) $demande->domaine_id) {
            throw ValidationException::withMessages([
                'service_id' => 'Choisissez un de vos services actifs correspondant au domaine de la demande.',
            ]);
        }

        if ($this->reservations->creneauOccupe($profil->id, $donnees['date_prevue'], $donnees['heure_prevue'])) {
            throw DemandeException::creneauOccupe();
        }

        $prix = $donnees['prix_final'] ?? $service->prix;

        $reservation = DB::transaction(function () use ($demande, $profil, $service, $donnees, $prix) {
            
            $verrouillee = $this->demandes->verrouiller($demande->id);

            if ((int) $verrouillee->statut_id !== CodeListe::id('StatutDemande', 'EN_ATTENTE')) {
                throw DemandeException::dejaPrise();
            }

            $reservation = $this->reservations->creerAvecDetails([
                'membre_id'               => $demande->membre_id,
                'profil_professionnel_id' => $profil->id,
                'demande_service_id'      => $demande->id,
                'date_prevue'             => $donnees['date_prevue'],
                'heure_prevue'            => $donnees['heure_prevue'],
                'adresse_intervention'    => implode(', ', array_filter([$demande->adresse, $demande->localite, $demande->ville])),
                'prix_final'              => $prix,
                'statut_id'               => CodeListe::id('StatutReservation', 'CONFIRMEE'),
                'date_confirmation'       => now(),
            ], [
                ['service_id' => $service->id, 'prix_service' => $prix],
            ]);

            $this->demandes->modifier($verrouillee, [
                'statut_id' => CodeListe::id('StatutDemande', 'ACCEPTEE'),
            ]);

                        $user        = $profil->membre->user;
            $prestataire = "{$user->prenom} " . mb_substr($user->nom, 0, 1) . ". ({$profil->titre_professionnel})";
            $date        = \Carbon\Carbon::parse($donnees['date_prevue'])->format('d/m/Y');

            $this->notifications->notifier(
                $demande->membre_id,
                'RESERVATION',
                'Votre demande a été acceptée',
                "Votre demande « {$demande->titre} » a été acceptée par {$prestataire}. "
                    . "Intervention prévue le {$date} à {$donnees['heure_prevue']}.",
                "/reservations/{$reservation->uuid}",
            );

            return $reservation;
        });

        return $reservation->load(['statut', 'demande', 'details.service']);
    }

    private function profilDe(Membre $membre): ProfilProfessionnel
    {
        return $this->profils->trouverParMembre($membre->id)
            ?? throw ProfilProException::pasPrestataire();
    }

    /** Construit les critères de filtrage à partir du profil du prestataire. */
    private function criteres(Membre $membre, ProfilProfessionnel $profil): array
    {
        $domaines = $profil->services()
            ->where('est_actif', true)
            ->distinct()
            ->pluck('domaine_id')
            ->all();

        return [
            'exclure_membre' => $membre->id,
            'domaines'       => $domaines,
            'depuis'         => now()->subDays(DemandesService::DUREE_VALIDITE_JOURS),
            'rayon'          => $profil->rayonIntervention?->value ?? 'VILLE',
            'ville'          => $membre->ville,
            'localite'       => $membre->localite,
            'villes'         => Zone::villesDeLaRegionDe($membre->ville),
        ];
    }
}