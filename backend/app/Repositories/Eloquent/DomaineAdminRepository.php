<?php

namespace App\Repositories\Eloquent;

use App\Models\Domaine;
use App\Repositories\Contracts\DomaineAdminRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DomaineAdminRepository implements DomaineAdminRepositoryInterface
{
    public function lister(?string $etat, ?string $recherche): Collection
    {
        $recherche = trim((string) $recherche);

        return $this->avecCompteurs(Domaine::query())
            ->when($etat === 'ACTIF', fn ($q) => $q->where('est_actif', true))
            ->when($etat === 'INACTIF', fn ($q) => $q->where('est_actif', false))
            ->when($recherche !== '', fn ($q) => $q->where('libelle', 'ILIKE', '%' . addcslashes($recherche, '%_\\') . '%'))
            ->orderByDesc('est_actif')          // les actifs d'abord
            ->orderBy('libelle')
            ->get();
    }

    public function trouver(int $id): Domaine
    {
        return $this->avecCompteurs(Domaine::query())->findOrFail($id);
    }

    public function creer(array $donnees): Domaine
    {
        return Domaine::create($donnees);
    }

    public function modifier(Domaine $domaine, array $donnees): Domaine
    {
        $domaine->update($donnees);

        return $domaine;
    }

    
    private function avecCompteurs(Builder $query): Builder
    {
        return $query->withCount([
            'services',
            'services as services_actifs_count' => fn ($q) => $q->where('est_actif', true),
            'services as prestataires_count'    => fn ($q) => $q->select(DB::raw('COUNT(DISTINCT profil_professionnel_id)')),
            'demandes',
        ]);
    }
}