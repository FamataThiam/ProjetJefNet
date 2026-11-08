<?php

namespace App\Repositories\Eloquent;

use App\Models\Reservation;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ReservationRepository implements ReservationRepositoryInterface
{
 
    private const STATUTS_ACTIFS = ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS'];


    private const RELATIONS = [
        'statut',
        'demande',
        'details.service',
        'client.user',
        'prestataire.membre.user',
    ];

    public function creerAvecDetails(array $donnees, array $details): Reservation
    {
        $reservation = Reservation::create($donnees);
        $reservation->details()->createMany($details);

        return $reservation;
    }

    public function creneauOccupe(int $profilId, string $date, string $heure): bool
    {
        return Reservation::query()
            ->where('profil_professionnel_id', $profilId)
            ->whereDate('date_prevue', $date)
            ->where('heure_prevue', $heure)
            ->whereHas('statut', fn ($s) => $s->whereIn('value', self::STATUTS_ACTIFS))
            ->exists();
    }

    public function pourClient(int $membreId, ?string $statut = null, int $parPage = 10): LengthAwarePaginator
    {
        return $this->filtrerParStatut(Reservation::where('membre_id', $membreId), $statut)
            ->with(self::RELATIONS)
            ->orderByDesc('date_prevue')
            ->orderByDesc('heure_prevue')
            ->paginate($parPage)
            ->withQueryString();
    }

    public function pourPrestataire(int $profilId, ?string $statut = null, int $parPage = 10): LengthAwarePaginator
    {
        return $this->filtrerParStatut(Reservation::where('profil_professionnel_id', $profilId), $statut)
            ->with(self::RELATIONS)
            ->orderByDesc('date_prevue')
            ->orderByDesc('heure_prevue')
            ->paginate($parPage)
            ->withQueryString();
    }

    public function trouverPourParticipant(string $uuid, int $membreId, ?int $profilId): Reservation
    {
        return Reservation::query()
            ->where('uuid', $uuid)
            ->where(function ($q) use ($membreId, $profilId) {
                $q->where('membre_id', $membreId);

                if ($profilId) {
                    $q->orWhere('profil_professionnel_id', $profilId);
                }
            })
            ->with(self::RELATIONS)
            ->firstOrFail();
    }

    public function trouverPourPrestataire(string $uuid, int $profilId): Reservation
    {
        return Reservation::query()
            ->where('uuid', $uuid)
            ->where('profil_professionnel_id', $profilId)
            ->with(self::RELATIONS)
            ->firstOrFail();
    }

    public function modifier(Reservation $reservation, array $donnees): Reservation
    {
        $reservation->update($donnees);

        return $reservation;
    }

    private function filtrerParStatut(Builder $requete, ?string $statut): Builder
    {
        return $requete->when($statut, fn ($q) => $q->whereHas('statut', fn ($s) => $s->where('value', $statut)));
    }
}