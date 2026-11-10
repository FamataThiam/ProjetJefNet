<?php

namespace App\Services;

use App\Exceptions\AvisException;
use App\Models\Avis;
use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Models\Reservation;
use App\Repositories\Contracts\AvisRepositoryInterface;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AvisService
{
    public const DELAI_MODIFICATION_JOURS = 7;

    public function __construct(
        private AvisRepositoryInterface $avis,
        private ReservationRepositoryInterface $reservations,
        private ProfilProfessionnelRepositoryInterface $profils,
        private NotificationService $notifications,
    ) {}

    

    public function laisser(Membre $client, string $uuid, array $donnees): Avis
    {
        $reservation = $this->reservationDuClient($client, $uuid);
        $reservation->loadMissing('rapport');

       
        if (! $reservation->rapport || ! $reservation->rapport->estSigneParLesDeux()) {
            throw AvisException::rapportNonSigne();
        }

        if ($this->avis->pourReservation($reservation->id)) {
            throw AvisException::dejaDonne();
        }

        try {
            $avis = DB::transaction(function () use ($reservation, $donnees, $client) {
                $avis = $this->avis->creer([
                    'reservation_id' => $reservation->id,
                    'note'           => $donnees['note'],
                    'commentaire'    => $donnees['commentaire'],
                ]);

                $this->recalculerNote($reservation->prestataire);

                $this->notifications->notifier(
                    $reservation->prestataire->membre_id,
                    'AVIS',
                    'Nouvel avis reçu',
                    "{$this->nomCourt($client)} vous a donné {$donnees['note']}/5 : « " . Str::limit($donnees['commentaire'], 80) . ' »',
                    "/prestataires/{$reservation->prestataire->id}",
                );

                return $avis;
            });
        } catch (QueryException $e) {
          
            if ($e->getCode() === '23505') {
                throw AvisException::dejaDonne();
            }
            throw $e;
        }

        return $avis->setRelation('reservation', $reservation);
    }


    public function modifier(Membre $client, string $uuid, array $donnees): Avis
    {
        $reservation = $this->reservationDuClient($client, $uuid);
        $avis        = $this->avis->pourReservation($reservation->id) ?? throw AvisException::introuvable();

        if ($avis->created_at->copy()->addDays(self::DELAI_MODIFICATION_JOURS)->isPast()) {
            throw AvisException::delaiDepasse();
        }

        DB::transaction(function () use ($avis, $donnees, $reservation, $client) {
            $this->avis->modifier($avis, array_intersect_key($donnees, array_flip(['note', 'commentaire'])));

            $this->recalculerNote($reservation->prestataire);

            $this->notifications->notifier(
                $reservation->prestataire->membre_id,
                'AVIS',
                'Avis modifié',
                "{$this->nomCourt($client)} a modifié son avis : {$avis->note}/5.",
                "/prestataires/{$reservation->prestataire->id}",
            );
        });

        return $avis->setRelation('reservation', $reservation);
    }

  
    public function monAvis(Membre $client, string $uuid): Avis
    {
        $reservation = $this->reservationDuClient($client, $uuid);

        return ($this->avis->pourReservation($reservation->id) ?? throw AvisException::introuvable())
            ->setRelation('reservation', $reservation);
    }

   

    /** @return array{avis: LengthAwarePaginator, statistiques: array} */
    public function duPrestataire(int $profilId): array
    {
        $this->profils->trouverVisible($profilId);   // 404 si le prestataire n'est pas visible

        return [
            'avis'         => $this->avis->pourPrestataire($profilId),
            'statistiques' => $this->avis->statistiques($profilId),
        ];
    }

   

    private function recalculerNote(ProfilProfessionnel $profil): void
    {
        $this->profils->modifier($profil, [
            'note_moyenne' => $this->avis->statistiques($profil->id)['moyenne'],
        ]);
    }

   

    /** Seul le client de la réservation peut noter (404 sinon). */
    private function reservationDuClient(Membre $client, string $uuid): Reservation
    {
        return $this->reservations->trouverPourParticipant($uuid, $client->id, null);
    }

    private function nomCourt(Membre $membre): string
    {
        return "{$membre->user->prenom} " . mb_substr($membre->user->nom, 0, 1) . '.';
    }
}