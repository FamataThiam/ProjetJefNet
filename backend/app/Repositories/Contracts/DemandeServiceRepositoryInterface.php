<?php

namespace App\Repositories\Contracts;

use App\Models\DemandeService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface DemandeServiceRepositoryInterface
{
    public function creer(array $donnees): DemandeService;
    public function pourMembre(int $membreId, ?string $statut = null, int $parPage = 10): LengthAwarePaginator;

        public function trouverPourMembre(int $membreId, string $uuid): DemandeService;

        public function modifier(DemandeService $demande, array $donnees): DemandeService;

        public function disponibles(array $criteres, int $parPage = 10): LengthAwarePaginator;

        public function trouverDisponible(array $criteres, string $uuid): DemandeService;

           
    public function verrouiller(int $id): DemandeService;

   
    public function expirer(\DateTimeInterface $avant, int $statutAttenteId, int $statutExpireId): int;
}