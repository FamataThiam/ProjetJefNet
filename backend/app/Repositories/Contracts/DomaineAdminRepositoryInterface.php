<?php

namespace App\Repositories\Contracts;

use App\Models\Domaine;
use Illuminate\Support\Collection;

interface DomaineAdminRepositoryInterface
{
   
    public function lister(?string $etat, ?string $recherche): Collection;

    public function trouver(int $id): Domaine;

    public function creer(array $donnees): Domaine;

    public function modifier(Domaine $domaine, array $donnees): Domaine;
}