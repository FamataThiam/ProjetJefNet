<?php

namespace App\Repositories\Eloquent;

use App\Models\Reservation;
use App\Repositories\Contracts\ReservationRepositoryInterface;

class ReservationRepository implements ReservationRepositoryInterface
{

    private const STATUTS_ACTIFS = ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS'];

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
}