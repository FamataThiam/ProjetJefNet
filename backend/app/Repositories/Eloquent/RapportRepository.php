<?php

namespace App\Repositories\Eloquent;

use App\Models\RapportPrestation;
use App\Repositories\Contracts\RapportRepositoryInterface;

class RapportRepository implements RapportRepositoryInterface
{
    public function pourReservation(int $reservationId): ?RapportPrestation
    {
        return RapportPrestation::query()
            ->where('reservation_id', $reservationId)
            ->with('statut')
            ->first();
    }

    public function creer(array $donnees): RapportPrestation
    {
        return RapportPrestation::create($donnees);
    }

    public function modifier(RapportPrestation $rapport, array $donnees): RapportPrestation
    {
        $rapport->update($donnees);

        return $rapport;
    }
}