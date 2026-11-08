<?php

namespace App\Repositories\Contracts;

use App\Models\Reservation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ReservationRepositoryInterface
{
   
    public function creerAvecDetails(array $donnees, array $details): Reservation;

   
    public function creneauOccupe(int $profilId, string $date, string $heure): bool;

   
    public function pourClient(int $membreId, ?string $statut = null, int $parPage = 10): LengthAwarePaginator;

   
    public function pourPrestataire(int $profilId, ?string $statut = null, int $parPage = 10): LengthAwarePaginator;

   
    public function trouverPourParticipant(string $uuid, int $membreId, ?int $profilId): Reservation;

 
    public function trouverPourPrestataire(string $uuid, int $profilId): Reservation;

    public function modifier(Reservation $reservation, array $donnees): Reservation;
}