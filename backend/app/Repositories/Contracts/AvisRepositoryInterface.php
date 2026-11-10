<?php

namespace App\Repositories\Contracts;

use App\Models\Avis;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AvisRepositoryInterface
{
    public function pourReservation(int $reservationId): ?Avis;

    public function creer(array $donnees): Avis;

    public function modifier(Avis $avis, array $donnees): Avis;

    /** Avis d'un prestataire, du plus récent au plus ancien. */
    public function pourPrestataire(int $profilId, int $parPage = 10): LengthAwarePaginator;

    /** Moyenne, nombre total et répartition des notes (1 à 5) d'un prestataire. */
    public function statistiques(int $profilId): array;
}