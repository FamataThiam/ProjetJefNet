<?php

namespace App\Services;

use App\Exceptions\ProfilProException;
use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Models\Service;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class CatalogueService
{
    public function __construct(
        private ProfilProfessionnelRepositoryInterface $profils,
        private ServiceRepositoryInterface $services,
    ) {}

    public function lister(Membre $membre): Collection
    {
        return $this->services->pourProfil($this->profilDe($membre)->id);
    }

    public function ajouter(Membre $membre, array $donnees): Service
    {
        $service = $this->services->creer($donnees + [
            'profil_professionnel_id' => $this->profilDe($membre)->id,
            'est_actif'               => true,
        ]);

        return $service->load('domaine');
    }

    public function modifier(Membre $membre, int $serviceId, array $donnees): Service
    {
        $service = $this->services->trouverPourProfil($serviceId, $this->profilDe($membre)->id);

        if ($donnees) {
            $this->services->modifier($service, $donnees);
        }

        return $service->load('domaine');
    }

    // Suppression logique : le service reste en base (réservations et factures conservées)
    public function desactiver(Membre $membre, int $serviceId): Service
    {
        return $this->modifier($membre, $serviceId, ['est_actif' => false]);
    }

    private function profilDe(Membre $membre): ProfilProfessionnel
    {
        return $this->profils->trouverParMembre($membre->id)
            ?? throw ProfilProException::pasPrestataire();
    }
}