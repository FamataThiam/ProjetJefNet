<?php

namespace App\Repositories\Eloquent;

use App\Models\ProfilProfessionnel;
use App\Repositories\Contracts\RecommandationRepositoryInterface;
use App\Support\Geo;
use Illuminate\Support\Collection;

class RecommandationRepository implements RecommandationRepositoryInterface
{
    public function candidats(?float $lat, ?float $lng, ?int $domaineId, ?int $exclureMembreId): Collection
    {
        $distance = Geo::distanceSql('profils_professionnels.latitude', 'profils_professionnels.longitude');

        return ProfilProfessionnel::query()
            ->select('profils_professionnels.*')

         
            ->when($lat !== null && $lng !== null, fn ($q) => $q->selectRaw(
                "CASE WHEN profils_professionnels.latitude IS NULL THEN NULL ELSE {$distance} END AS distance_km",
                [$lat, $lng, $lat]
            ))

        
            ->whereHas('membre.user.statutCompte', fn ($s) => $s->where('value', 'ACTIF'))
            ->whereHas('services', fn ($s) => $s
                ->where('est_actif', true)
                ->when($domaineId, fn ($q) => $q->where('domaine_id', $domaineId)))

            
            ->when($exclureMembreId, fn ($q) => $q->where('membre_id', '!=', $exclureMembreId))

            ->with(['membre.user', 'statutCertification'])
            ->withCount([
                'avis as nombre_avis',
                'reservations as prestations_terminees' => fn ($r) => $r->whereHas(
                    'statut', fn ($s) => $s->where('value', 'TERMINEE')
                ),
                'disponibilites as creneaux_7_jours' => fn ($d) => $d
                    ->where('est_disponible', true)
                    ->whereBetween('jour_disponibilite', [today(), today()->addDays(7)]),
            ])
            ->withMin(['services as prix_min' => fn ($s) => $s->where('est_actif', true)], 'prix')
            ->get();
    }
}