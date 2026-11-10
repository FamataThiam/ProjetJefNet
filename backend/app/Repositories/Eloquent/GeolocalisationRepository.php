<?php

namespace App\Repositories\Eloquent;

use App\Models\ProfilProfessionnel;
use App\Repositories\Contracts\GeolocalisationRepositoryInterface;
use App\Support\Geo;
use Illuminate\Support\Collection;

class GeolocalisationRepository implements GeolocalisationRepositoryInterface
{
    public function autourDe(float $lat, float $lng, float $rayonKm, ?int $domaineId = null, int $limite = 100): Collection
    {
        $distance = Geo::distanceSql('profils_professionnels.latitude', 'profils_professionnels.longitude');
        [$latMin, $latMax, $lngMin, $lngMax] = Geo::rectangle($lat, $lng, $rayonKm);

        return ProfilProfessionnel::query()
            ->select('profils_professionnels.*')
            ->selectRaw("{$distance} AS distance_km", [$lat, $lng, $lat])

            // 1) Filtre rapide par rectangle (utilise l'index latitude/longitude)
            ->whereBetween('profils_professionnels.latitude', [$latMin, $latMax])
            ->whereBetween('profils_professionnels.longitude', [$lngMin, $lngMax])

            // 2) Distance exacte dans le cercle
            ->whereRaw("{$distance} <= ?", [$lat, $lng, $lat, $rayonKm])

            // 3) Seulement les prestataires visibles : compte actif + au moins un service actif (du domaine demandé)
            ->whereHas('membre.user.statutCompte', fn ($s) => $s->where('value', 'ACTIF'))
            ->whereHas('services', fn ($s) => $s
                ->where('est_actif', true)
                ->when($domaineId, fn ($q) => $q->where('domaine_id', $domaineId)))

            ->with(['membre.user', 'statutCertification'])
            ->withMin(['services as prix_min' => fn ($s) => $s->where('est_actif', true)], 'prix')
            ->withCount('avis as nombre_avis')
            ->orderBy('distance_km')
            ->limit($limite)
            ->get();
    }
}