<?php

namespace App\Services;

use App\Models\ProfilProfessionnel;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PrestataireService
{
    public function __construct(private ProfilProfessionnelRepositoryInterface $profils) {}

    public function rechercher(array $filtres): LengthAwarePaginator
    {
        return $this->profils->rechercher($filtres, 12);
    }

    public function profilPublic(int $id): ProfilProfessionnel
    {
        return $this->profils->trouverVisible($id);
    }


    public function idDepuisUuid(string $uuid): int
    {
        $id = ProfilProfessionnel::whereHas('membre.user', fn ($q) => $q->where('uuid', $uuid))->value('id');

        abort_if($id === null, 404, 'Prestataire introuvable.');

        return $id;
    }
}