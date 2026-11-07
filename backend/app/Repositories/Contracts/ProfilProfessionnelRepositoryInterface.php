<?php

namespace App\Repositories\Contracts;

use App\Models\ProfilProfessionnel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProfilProfessionnelRepositoryInterface
{
    public function rechercher(array $filtres, int $parPage = 12): LengthAwarePaginator;

    public function trouverVisible(int $id): ProfilProfessionnel;

    public function trouverParMembre(int $membreId): ?ProfilProfessionnel;

    public function creer(array $donnees): ProfilProfessionnel;

    public function modifier(ProfilProfessionnel $profil, array $donnees): ProfilProfessionnel;

        public function desactiverServices(ProfilProfessionnel $profil): int;
}