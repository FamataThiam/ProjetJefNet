<?php

namespace App\Repositories\Contracts;

use App\Models\Disponibilite;
use Illuminate\Database\Eloquent\Collection;

interface DisponibiliteRepositoryInterface
{
    public function aVenirPourProfil(int $profilId): Collection;

    public function trouverPourProfil(int $id, int $profilId): Disponibilite;

    public function chevauche(int $profilId, string $jour, string $debut, string $fin, ?int $saufId = null): bool;

    public function creer(array $donnees): Disponibilite;

    public function modifier(Disponibilite $dispo, array $donnees): Disponibilite;

    public function supprimer(Disponibilite $dispo): void;
}