<?php

namespace App\Repositories\Contracts;

use App\Models\Service;
use Illuminate\Database\Eloquent\Collection;

interface ServiceRepositoryInterface
{
    public function pourProfil(int $profilId): Collection;

    public function trouverPourProfil(int $serviceId, int $profilId): Service;

    public function creer(array $donnees): Service;

    public function modifier(Service $service, array $donnees): Service;
}