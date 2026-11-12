<?php

namespace App\Repositories\Contracts;

use App\Models\Membre;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\Reservation;
use Illuminate\Support\Collection;

interface MembreAdminRepositoryInterface
{
  
    public function lister(array $filtres, int $parPage = 15): LengthAwarePaginator;

    public function trouver(int $membreId): Membre;

    public function statistiques(Membre $membre): array;

    public function modifierUser(User $user, array $donnees): User;

   
    public function supprimerTokens(User $user): int;


        
    public function reservationsAVenir(Membre $membre): Collection;

    public function annulerReservation(Reservation $reservation, string $raison): void;
}