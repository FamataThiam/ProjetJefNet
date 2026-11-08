<?php

namespace App\Services;

use App\Exceptions\ProfilProException;
use App\Exceptions\ReservationException;
use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Models\Reservation;
use App\Repositories\Contracts\DemandeServiceRepositoryInterface;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use App\Support\CodeListe;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReservationService
{
    private const RELATIONS = ['statut', 'demande', 'details.service', 'client.user', 'prestataire.membre.user'];

    public function __construct(
        private ReservationRepositoryInterface $reservations,
        private ProfilProfessionnelRepositoryInterface $profils,
        private DemandeServiceRepositoryInterface $demandes,
        private NotificationService $notifications,
    ) {}

    
    public function reserver(Membre $client, array $donnees): Reservation
    {
        $profil = $this->profils->trouverVisible($donnees['profil_id']);   // 404 si invisible

        if ((int) $profil->membre_id === (int) $client->id) {
            throw ReservationException::propreService();
        }

        $services = $profil->services()
            ->whereIn('id', $donnees['services'])
            ->where('est_actif', true)
            ->get();

        if ($services->count() !== count($donnees['services'])) {
            throw ValidationException::withMessages([
                'services' => "Un ou plusieurs services n'appartiennent pas à ce prestataire ou ne sont plus proposés.",
            ]);
        }

       
        if ($this->reservations->creneauOccupe($profil->id, $donnees['date_prevue'], $donnees['heure_prevue'])) {
            throw ReservationException::creneauIndisponible();
        }

        $reservation = DB::transaction(function () use ($client, $profil, $services, $donnees) {
            $reservation = $this->reservations->creerAvecDetails([
                'membre_id'               => $client->id,
                'profil_professionnel_id' => $profil->id,
                'date_prevue'             => $donnees['date_prevue'],
                'heure_prevue'            => $donnees['heure_prevue'],
                'adresse_intervention'    => $donnees['adresse_intervention'],
                'prix_final'              => $services->sum('prix'),
                'statut_id'               => CodeListe::id('StatutReservation', 'EN_ATTENTE'),
            ], $services->map(fn ($s) => [
                'service_id'   => $s->id,
                'prix_service' => $s->prix,
            ])->all());

            $this->notifications->notifier(
                $profil->membre_id,
                'RESERVATION',
                'Nouvelle réservation',
                "{$this->nomCourt($client)} souhaite réserver « {$services->pluck('nom')->join(', ')} » "
                    . "le {$this->dateFr($donnees['date_prevue'])} à {$donnees['heure_prevue']}.",
                "/reservations/{$reservation->uuid}",
            );

            return $reservation;
        });

        return $reservation->load(self::RELATIONS);
    }

    
    public function mesReservations(Membre $client, ?string $statut = null): LengthAwarePaginator
    {
        return $this->reservations->pourClient($client->id, $statut);
    }

   
    public function reservationsRecues(Membre $membre, ?string $statut = null): LengthAwarePaginator
    {
        return $this->reservations->pourPrestataire($this->profilDe($membre)->id, $statut);
    }

   
    public function confirmer(Membre $membre, string $uuid): Reservation
    {
        $reservation = $this->reservationRecue($membre, $uuid);
        $this->exigerStatut($reservation, ['EN_ATTENTE'], 'confirmer');

        $this->changerStatut($reservation, 'CONFIRMEE', ['date_confirmation' => now()]);

        $this->notifierClient($reservation, 'Réservation confirmée',
            "{$this->nomPrestataire($reservation)} a confirmé votre réservation {$this->quand($reservation)}.");

        return $reservation->load(self::RELATIONS);
    }

    
    public function refuser(Membre $membre, string $uuid, ?string $raison): Reservation
    {
        $reservation = $this->reservationRecue($membre, $uuid);
        $this->exigerStatut($reservation, ['EN_ATTENTE'], 'refuser');

        $this->changerStatut($reservation, 'REFUSEE', ['raison_annulation' => $raison]);

        $this->notifierClient($reservation, 'Réservation refusée',
            "{$this->nomPrestataire($reservation)} ne peut pas assurer votre réservation {$this->quand($reservation)}."
                . ($raison ? " Motif : {$raison}" : ''));

        return $reservation->load(self::RELATIONS);
    }

    /** 7. Démarrer la prestation : CONFIRMEE → EN_COURS (pas avant le jour prévu). */
    public function demarrer(Membre $membre, string $uuid): Reservation
    {
        $reservation = $this->reservationRecue($membre, $uuid);
        $this->exigerStatut($reservation, ['CONFIRMEE'], 'démarrer');

        if ($reservation->date_prevue->isAfter(today())) {
            throw ReservationException::tropTot();
        }

        $this->changerStatut($reservation, 'EN_COURS');

        $this->notifierClient($reservation, 'Prestation démarrée',
            "{$this->nomPrestataire($reservation)} a démarré la prestation.");

        return $reservation->load(self::RELATIONS);
    }

  
    public function terminer(Membre $membre, string $uuid): Reservation
    {
        $reservation = $this->reservationRecue($membre, $uuid);
        $this->exigerStatut($reservation, ['EN_COURS'], 'terminer');

        DB::transaction(function () use ($reservation) {
            $this->changerStatut($reservation, 'TERMINEE');

            if ($reservation->demande) {
                $this->demandes->modifier($reservation->demande, [
                    'statut_id' => CodeListe::id('StatutDemande', 'CONCLUE'),
                ]);
            }

            $this->notifierClient($reservation, 'Prestation terminée',
                "{$this->nomPrestataire($reservation)} a terminé la prestation. "
                    . 'Vous pourrez consulter et signer son rapport, puis laisser un avis.');
        });

        return $reservation->load(self::RELATIONS);
    }

    
    public function consulter(Membre $membre, string $uuid): Reservation
    {
        $profilId = $this->profils->trouverParMembre($membre->id)?->id;

        return $this->reservations->trouverPourParticipant($uuid, $membre->id, $profilId);
    }

  
    public function annuler(Membre $membre, string $uuid, string $raison): Reservation
    {
        $reservation = $this->consulter($membre, $uuid);
        $this->exigerStatut($reservation, ['EN_ATTENTE', 'CONFIRMEE'], 'annuler');

        $parClient = (int) $reservation->membre_id === (int) $membre->id;

        DB::transaction(function () use ($reservation, $raison, $parClient) {
            $this->changerStatut($reservation, 'ANNULEE', [
                'date_annulation'   => now(),
                'raison_annulation' => $raison,
            ]);

           
            if ($reservation->demande) {
                $this->demandes->modifier($reservation->demande, [
                    'statut_id' => CodeListe::id('StatutDemande', $parClient ? 'ANNULEE' : 'EN_ATTENTE'),
                ]);
            }

            if ($parClient) {
                $this->notifications->notifier(
                    $reservation->prestataire->membre_id,
                    'RESERVATION',
                    'Réservation annulée',
                    "{$this->nomCourt($reservation->client)} a annulé la réservation {$this->quand($reservation)}. Motif : {$raison}",
                    "/reservations/{$reservation->uuid}",
                );
            } else {
                $this->notifierClient($reservation, 'Réservation annulée',
                    "{$this->nomPrestataire($reservation)} a annulé votre réservation {$this->quand($reservation)}. Motif : {$raison}"
                        . ($reservation->demande ? ' Votre demande est de nouveau visible par les prestataires.' : ''));
            }
        });

        return $reservation->load(self::RELATIONS);
    }

   

    private function profilDe(Membre $membre): ProfilProfessionnel
    {
        return $this->profils->trouverParMembre($membre->id)
            ?? throw ProfilProException::pasPrestataire();
    }

    private function reservationRecue(Membre $membre, string $uuid): Reservation
    {
        return $this->reservations->trouverPourPrestataire($uuid, $this->profilDe($membre)->id);
    }

    private function exigerStatut(Reservation $reservation, array $autorises, string $action): void
    {
        $actuel = $reservation->statut->value;

        if (! in_array($actuel, $autorises, true)) {
            throw ReservationException::actionImpossible($action, $actuel);
        }
    }

    private function changerStatut(Reservation $reservation, string $statut, array $autres = []): void
    {
        $this->reservations->modifier($reservation, $autres + [
            'statut_id' => CodeListe::id('StatutReservation', $statut),
        ]);
    }

    private function notifierClient(Reservation $reservation, string $titre, string $contenu): void
    {
        $this->notifications->notifier(
            $reservation->membre_id,
            'RESERVATION',
            $titre,
            $contenu,
            "/reservations/{$reservation->uuid}",
        );
    }

    private function nomCourt(Membre $membre): string
    {
        $user = $membre->user;

        return "{$user->prenom} " . mb_substr($user->nom, 0, 1) . '.';
    }

    private function nomPrestataire(Reservation $reservation): string
    {
        return "{$this->nomCourt($reservation->prestataire->membre)} ({$reservation->prestataire->titre_professionnel})";
    }

    private function quand(Reservation $reservation): string
    {
        return "du {$this->dateFr($reservation->date_prevue)} à " . substr((string) $reservation->heure_prevue, 0, 5);
    }

    private function dateFr($date): string
    {
        return Carbon::parse($date)->format('d/m/Y');
    }
}