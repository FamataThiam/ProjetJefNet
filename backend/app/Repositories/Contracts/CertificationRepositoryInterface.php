<?php

namespace App\Repositories\Contracts;

use App\Models\ProfilProfessionnel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CertificationRepositoryInterface
{
   
    public function lister(?string $statut, int $parPage = 15): LengthAwarePaginator;

    
    public function trouver(int $profilId): ProfilProfessionnel;

    public function modifier(ProfilProfessionnel $profil, array $donnees): ProfilProfessionnel;
}