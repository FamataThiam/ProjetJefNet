<?php

namespace App\Repositories\Contracts;

use App\Models\RapportPrestation;

interface RapportRepositoryInterface
{
   
    public function pourReservation(int $reservationId): ?RapportPrestation;

    public function creer(array $donnees): RapportPrestation;

    public function modifier(RapportPrestation $rapport, array $donnees): RapportPrestation;
}