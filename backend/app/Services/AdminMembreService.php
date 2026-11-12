<?php

namespace App\Services;

use App\Exceptions\MembreAdminException;
use App\Models\Administrateur;
use App\Models\Membre;
use App\Repositories\Contracts\MembreAdminRepositoryInterface;
use App\Support\CodeListe;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminMembreService
{
    public function __construct(
        private MembreAdminRepositoryInterface $membres,
        private NotificationService $notifications,
    ) {}



    public function lister(array $filtres): LengthAwarePaginator
    {
        return $this->membres->lister($filtres);
    }



    /** @return array{0: Membre, 1: array} */
    public function detail(int $membreId): array
    {
        $membre = $this->membres->trouver($membreId);

        return [$membre, $this->membres->statistiques($membre)];
    }

   

    /** @return array{0: Membre, 1: int} le membre + le nombre de réservations annulées */
    public function suspendre(Administrateur $admin, int $membreId, string $motif): array
    {
        $membre = $this->membres->trouver($membreId);
        $user   = $membre->user;

        if ($user->id === $admin->user_id) {
            throw MembreAdminException::soiMeme();
        }
        if ($user->administrateur) {
            throw MembreAdminException::compteAdministrateur();
        }

        match ($user->statutCompte?->value) {
            'BLOQUE'  => throw MembreAdminException::dejaBloque(),
            'INACTIF' => throw MembreAdminException::compteFerme(),
            default   => null,                       // ACTIF ou SIGNALE : on peut suspendre
        };

        $annulees = DB::transaction(function () use ($membre, $user, $admin, $motif) {
            $this->membres->modifierUser($user, [
                'statut_compte_id' => CodeListe::id('StatutCompte', 'BLOQUE'),
                'motif_blocage'    => $motif,
                'bloque_le'        => now(),
                'bloque_par'       => $admin->id,
            ]);

         
            $this->membres->supprimerTokens($user);

            
            $annulees = $this->annulerReservationsAVenir($membre);

            
            $this->notifications->notifier(
                $membre->id,
                'PROFIL',
                'Compte suspendu',
                "Votre compte a été suspendu par l'administration JefNet. Motif : {$motif}",
                '/profil',
            );

            return $annulees;
        });

        return [$this->membres->trouver($membreId), $annulees];
    }

    

    public function reactiver(Administrateur $admin, int $membreId): Membre
    {
        $membre = $this->membres->trouver($membreId);
        $user   = $membre->user;

        if ($user->statutCompte?->value !== 'BLOQUE') {
            throw MembreAdminException::pasBloque();
        }

        DB::transaction(function () use ($membre, $user) {
            $this->membres->modifierUser($user, [
                'statut_compte_id' => CodeListe::id('StatutCompte', 'ACTIF'),
                'motif_blocage'    => null,
                'bloque_le'        => null,
                'bloque_par'       => null,
            ]);

            $this->notifications->notifier(
                $membre->id,
                'PROFIL',
                'Compte réactivé',
                'Votre compte JefNet a été réactivé. Vous pouvez de nouveau utiliser toutes les fonctionnalités de la plateforme.',
                '/profil',
            );
        });

        return $this->membres->trouver($membreId);
    }

  
    private function annulerReservationsAVenir(Membre $membre): int
    {
        $reservations = $this->membres->reservationsAVenir($membre);

        foreach ($reservations as $reservation) {
            $suspenduEstClient = $reservation->client?->id === $membre->id;

            $this->membres->annulerReservation(
                $reservation,
                $suspenduEstClient
                    ? "Compte du client suspendu par l'administration JefNet."
                    : "Compte du prestataire suspendu par l'administration JefNet."
            );

          
            $destinataire = $suspenduEstClient
                ? $reservation->prestataire?->membre_id
                : $reservation->client?->id;

            if (! $destinataire) {
                continue;
            }

            $date = $reservation->date_prevue?->format('d/m/Y');

            $this->notifications->notifier(
                $destinataire,
                'RESERVATION',
                'Réservation annulée',
                $suspenduEstClient
                    ? "La réservation prévue le {$date} a été annulée : le compte du client a été suspendu par l'administration JefNet."
                    : "Votre réservation prévue le {$date} a été annulée : le compte du prestataire a été suspendu par l'administration JefNet. "
                        . 'Vous pouvez publier une nouvelle demande ou réserver un autre prestataire.',
                '/reservations/' . $reservation->uuid,
            );
        }

        return $reservations->count();
    }
}