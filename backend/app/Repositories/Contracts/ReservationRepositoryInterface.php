<?php

namespace App\Repositories\Contracts;

use App\Models\Reservation;

interface ReservationRepositoryInterface
{
    
    public function creerAvecDetails(array $donnees, array $details): Reservation;

    
    public function creneauOccupe(int $profilId, string $date, string $heure): bool;
}