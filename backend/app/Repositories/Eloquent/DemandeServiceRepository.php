<?php

namespace App\Repositories\Eloquent;

use App\Models\DemandeService;
use App\Repositories\Contracts\DemandeServiceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use App\Support\Geo;

class DemandeServiceRepository implements DemandeServiceRepositoryInterface
{
    public function creer(array $donnees): DemandeService
    {
        return DemandeService::create($donnees);
    }


        public function pourMembre(int $membreId, ?string $statut = null, int $parPage = 10): LengthAwarePaginator
    {
        return DemandeService::query()
            ->where('membre_id', $membreId)
            ->when($statut, fn ($q) => $q->whereHas('statut', fn ($s) => $s->where('value', $statut)))
            ->with(['domaine', 'statut'])
            ->latest()
            ->paginate($parPage)
           ->withQueryString();
    }

    public function trouverPourMembre(int $membreId, string $uuid): DemandeService
    {
        return DemandeService::query()
            ->where('membre_id', $membreId)
            ->where('uuid', $uuid)
            ->with(['domaine', 'statut'])
            ->firstOrFail();
    }

    public function modifier(DemandeService $demande, array $donnees): DemandeService
    {
        $demande->update($donnees);

        return $demande;
    }

 public function disponibles(array $criteres, int $parPage = 10): LengthAwarePaginator
{
    return $this->avecDistance($this->requeteDisponibles($criteres), $criteres)
        ->with(['domaine', 'statut'])
        ->paginate($parPage);
}

public function trouverDisponible(array $criteres, string $uuid): DemandeService
{
    return $this->avecDistance($this->requeteDisponibles($criteres), $criteres)
        ->where('uuid', $uuid)
        ->with(['domaine', 'statut'])
        ->firstOrFail();
}



/** Ajoute la distance au prestataire (si sa position est connue) et trie de la plus proche à la plus éloignée. */
private function avecDistance(Builder $requete, array $c): Builder
{
    if (empty($c['lat']) || empty($c['lng'])) {
        return $requete->latest();   // pas de position : tri par date, comme avant
    }

    return $requete
        ->select('demandes_service.*')
        ->selectRaw(
            Geo::distanceSql('demandes_service.latitude', 'demandes_service.longitude') . ' AS distance_km',
            [$c['lat'], $c['lng'], $c['lat']]
        )
        ->orderBy('distance_km');
}

private function requeteDisponibles(array $c): Builder
{
    $min = fn (?string $v) => mb_strtolower(trim((string) $v));

    $requete = DemandeService::query()
        ->where('membre_id', '!=', $c['exclure_membre'])
        ->whereIn('domaine_id', $c['domaines'])
        ->where('created_at', '>=', $c['depuis'])
        ->whereHas('statut', fn ($s) => $s->where('value', 'EN_ATTENTE'));

    return match ($c['rayon']) {
        'LOCALITE' => $requete->whereRaw('LOWER(ville) = ?', [$min($c['ville'])])
                              ->whereRaw('LOWER(localite) = ?', [$min($c['localite'])]),
        'VILLE'    => $requete->whereRaw('LOWER(ville) = ?', [$min($c['ville'])]),
        'REGION'   => $requete->whereIn(DB::raw('LOWER(ville)'), array_map($min, $c['villes'])),
        default    => $requete, // PAYS : tout le Sénégal
    };
}



    public function verrouiller(int $id): DemandeService
    {
        return DemandeService::whereKey($id)->lockForUpdate()->firstOrFail();
    }

    public function expirer(\DateTimeInterface $avant, int $statutAttenteId, int $statutExpireId): int
    {
        return DemandeService::query()
            ->where('statut_id', $statutAttenteId)
            ->where('created_at', '<', $avant)
            ->update(['statut_id' => $statutExpireId]);
    }
}