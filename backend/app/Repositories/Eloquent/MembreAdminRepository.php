<?php

namespace App\Repositories\Eloquent;

use App\Models\Membre;
use App\Models\Reservation;
use App\Models\User;
use App\Repositories\Contracts\MembreAdminRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Support\CodeListe;
use Illuminate\Support\Collection;

class MembreAdminRepository implements MembreAdminRepositoryInterface
{
    private const RELATIONS = [
        'user.statutCompte',
        'user.administrateur',
        'user.bloquePar.user',
        'profilProfessionnel.statutCertification',
    ];

    public function lister(array $filtres, int $parPage = 15): LengthAwarePaginator
    {
        $recherche = trim((string) ($filtres['recherche'] ?? ''));
        $role      = $filtres['role'] ?? null;
        $statut    = $filtres['statut'] ?? null;

        return Membre::query()
            ->with(self::RELATIONS)
            ->withCount('demandes')

         
            ->when($recherche !== '', function ($q) use ($recherche) {
                $motif = '%' . addcslashes($recherche, '%_\\') . '%';

                $q->where(function ($q) use ($motif) {
                    $q->where('telephone', 'ILIKE', $motif)
                      ->orWhere('username', 'ILIKE', $motif)
                      ->orWhereHas('user', fn ($u) => $u
                          ->whereRaw("(prenom || ' ' || nom) ILIKE ?", [$motif])
                          ->orWhereRaw("(nom || ' ' || prenom) ILIKE ?", [$motif])
                          ->orWhere('email', 'ILIKE', $motif));
                });
            })

            
            ->when($role === 'PRESTATAIRE', fn ($q) => $q->whereHas('profilProfessionnel'))
            ->when($role === 'CLIENT', fn ($q) => $q->whereDoesntHave('profilProfessionnel'))

            ->when($statut, fn ($q) => $q->whereHas('user.statutCompte', fn ($s) => $s->where('value', $statut)))

            ->latest()  
            ->orderByDesc('id')                            
            ->paginate($parPage)
            ->withQueryString();
    }

    public function trouver(int $membreId): Membre
    {
        return Membre::query()
            ->with(self::RELATIONS)
            ->withCount('demandes')
            ->findOrFail($membreId);
    }

    public function statistiques(Membre $membre): array
    {
        $stats = [
            'demandes_publiees'    => $membre->demandes()->count(),
            'reservations_client'  => Reservation::whereHas('client', fn ($q) => $q->whereKey($membre->id))->count(),
        ];

        $profil = $membre->profilProfessionnel;

        if ($profil) {
            $recues = Reservation::whereHas('prestataire', fn ($q) => $q->whereKey($profil->id));

            $stats['prestations_recues']    = (clone $recues)->count();
            $stats['prestations_terminees'] = (clone $recues)->whereHas('statut', fn ($s) => $s->where('value', 'TERMINEE'))->count();
            $stats['avis_recus']            = $profil->avis()->count();
            $stats['note_moyenne']          = (float) $profil->note_moyenne;
        }

        return $stats;
    }

    public function modifierUser(User $user, array $donnees): User
    {
        $user->update($donnees);

        return $user;
    }

    public function supprimerTokens(User $user): int
    {
        return $user->tokens()->delete();
    }



        public function reservationsAVenir(Membre $membre): Collection
    {
        $profilId = $membre->profilProfessionnel?->id;

        return Reservation::query()
            ->whereHas('statut', fn ($s) => $s->whereIn('value', ['EN_ATTENTE', 'CONFIRMEE']))
            ->where(function ($q) use ($membre, $profilId) {
                $q->whereHas('client', fn ($c) => $c->whereKey($membre->id));

                if ($profilId) {
                    $q->orWhereHas('prestataire', fn ($p) => $p->whereKey($profilId));
                }
            })
            ->with(['client', 'prestataire'])
            ->lockForUpdate()                  // personne ne la modifie pendant l'annulation
            ->get();
    }

    public function annulerReservation(Reservation $reservation, string $raison): void
    {
        $reservation->statut()->associate(CodeListe::id('StatutReservation', 'ANNULEE'));
        $reservation->forceFill([
            'raison_annulation' => $raison,
        ])->save();
    }
}