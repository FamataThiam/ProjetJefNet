<?php

namespace App\Repositories\Eloquent;

use App\Models\Domaine;
use App\Repositories\Contracts\DomaineRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DomaineRepository implements DomaineRepositoryInterface
{
    public function tousAvecNombrePrestataires(): Collection
    {
        return Domaine::query()
            ->withCount(['services as nombre_prestataires' => function ($q) {
                $q->where('est_actif', true)
                  ->select(DB::raw('COUNT(DISTINCT profil_professionnel_id)'));
            }])
            ->orderBy('libelle')
            ->get();
    }
}