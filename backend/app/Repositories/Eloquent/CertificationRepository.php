<?php

namespace App\Repositories\Eloquent;

use App\Models\ProfilProfessionnel;
use App\Repositories\Contracts\CertificationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CertificationRepository implements CertificationRepositoryInterface
{
    private const RELATIONS = ['membre.user', 'statutCertification', 'traiteePar.user'];

    public function lister(?string $statut, int $parPage = 15): LengthAwarePaginator
    {
        return ProfilProfessionnel::query()
            ->when($statut, fn ($q) => $q->whereHas('statutCertification', fn ($s) => $s->where('value', $statut)))
            ->with(self::RELATIONS)
            ->withCount(['services as nombre_services_actifs' => fn ($s) => $s->where('est_actif', true)])
                        ->orderByRaw('certification_demandee_le ASC NULLS LAST')   
            ->orderBy('id')                    
            ->paginate($parPage)
            ->withQueryString();
    }

    public function trouver(int $profilId): ProfilProfessionnel
    {
        return ProfilProfessionnel::query()
            ->with(self::RELATIONS)
            ->withCount(['services as nombre_services_actifs' => fn ($s) => $s->where('est_actif', true)])
            ->findOrFail($profilId);
    }

    public function modifier(ProfilProfessionnel $profil, array $donnees): ProfilProfessionnel
    {
        $profil->update($donnees);

        return $profil;
    }
}