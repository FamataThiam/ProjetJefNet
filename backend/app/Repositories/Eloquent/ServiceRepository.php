<?php

namespace App\Repositories\Eloquent;

use App\Models\Service;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ServiceRepository implements ServiceRepositoryInterface
{
    // Tous les services du prestataire : actifs d'abord, puis par nom
    public function pourProfil(int $profilId): Collection
    {
        return Service::where('profil_professionnel_id', $profilId)
            ->with('domaine')
            ->orderByDesc('est_actif')
            ->orderBy('nom')
            ->get();
    }

    // Le service doit appartenir au prestataire, sinon 404
    public function trouverPourProfil(int $serviceId, int $profilId): Service
    {
        return Service::where('profil_professionnel_id', $profilId)->findOrFail($serviceId);
    }

    public function creer(array $donnees): Service
    {
        return Service::create($donnees);
    }

    public function modifier(Service $service, array $donnees): Service
    {
        $service->update($donnees);

        return $service;
    }
}