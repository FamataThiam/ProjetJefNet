<?php

namespace App\Repositories\Eloquent;

use App\Models\DemandeService;
use App\Models\Media;
use App\Models\ProfilProfessionnel;
use App\Models\Publication;
use App\Models\Reservation;
use App\Repositories\Contracts\PublicationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class PublicationRepository implements PublicationRepositoryInterface
{
    private const RELATIONS = [
        'prestataire.membre.user',
        'prestataire.statutCertification',
        'medias.type',
    ];

   

    public function creer(array $donnees): Publication
    {
        return Publication::create($donnees);
    }

    public function ajouterMedia(Publication $publication, array $donnees): Media
    {
        return $publication->medias()->create($donnees);
    }

    public function modifier(Publication $publication, array $donnees): Publication
    {
        $publication->update($donnees);

        return $publication;
    }

    public function supprimer(Publication $publication): void
    {
        $publication->tousCommentaires()->delete();
        $publication->medias()->delete();
        $publication->delete();
    }

  

    public function trouverVisible(int $id): Publication
    {
        return $this->base()->where('publications.est_active', true)->findOrFail($id);
    }

    public function trouverPourPrestataire(int $id, int $profilId): Publication
    {
        return $this->base()->where('profil_professionnel_id', $profilId)->findOrFail($id);
    }

    public function trouver(int $id): Publication
    {
        return $this->base()->findOrFail($id);
    }

    public function duPrestataire(int $profilId, bool $inclureMasquees, int $parPage = 10): LengthAwarePaginator
    {
        return $this->base()
            ->where('profil_professionnel_id', $profilId)
            ->when(! $inclureMasquees, fn ($q) => $q->where('est_active', true))
            ->orderByDesc('date_publication')
            ->orderByDesc('id')
            ->paginate($parPage)
            ->withQueryString();
    }


        public function listerAdmin(?string $etat, int $parPage = 15): LengthAwarePaginator
    {
        return $this->base()
            ->when($etat === 'VISIBLE', fn ($q) => $q->where('est_active', true))
            ->when($etat === 'MASQUEE', fn ($q) => $q->where('est_active', false))
            ->orderByDesc('date_publication')
            ->orderByDesc('id')
            ->paginate($parPage)
            ->withQueryString();
    }


    public function fil(array $c, int $parPage = 10): LengthAwarePaginator
    {
        $q = $this->base()
            ->select('publications.*')
            ->join('profils_professionnels as pp', 'pp.id', '=', 'publications.profil_professionnel_id')
            ->join('membres as m', 'm.id', '=', 'pp.membre_id')
            ->join('users as u', 'u.id', '=', 'm.user_id')
            ->where('publications.est_active', true)
            ->whereIn('u.statut_compte_id', $c['statuts_visibles']);   // pas les comptes bloqués

        $date = 'COALESCE(publications.date_publication, publications.created_at)';

        switch ($c['onglet']) {

            
            case 'mes-prestataires':
                $q->whereIn('pp.id', $c['reserves'] ?: [0])
                  ->orderByRaw("{$date} DESC");
                break;

            
            case 'pres':
                if ($c['lat'] !== null && $c['lng'] !== null) {
                    $distance = '6371 * acos(LEAST(1, cos(radians(?)) * cos(radians(pp.latitude)) '
                        . '* cos(radians(pp.longitude) - radians(?)) + sin(radians(?)) * sin(radians(pp.latitude))))';

                    $q->whereNotNull('pp.latitude')
                      ->whereRaw("{$distance} <= ?", [$c['lat'], $c['lng'], $c['lat'], $c['rayon_km']])
                      ->orderByRaw("{$date} DESC");
                } else {
                    $q->where('m.ville', 'ILIKE', $c['ville'] ?? '')
                      ->orderByRaw("CASE WHEN m.localite ILIKE ? THEN 0 ELSE 1 END", [$c['localite'] ?? ''])
                      ->orderByRaw("{$date} DESC");
                }
                break;

          
            default:
                [$sql, $liaisons] = $this->score($c, $date);
                $q->selectRaw("({$sql}) AS score", $liaisons)
                  ->orderByDesc('score');
        }

        return $q->orderByDesc('publications.id')
            ->paginate($parPage)
            ->withQueryString();
    }

    
    private function score(array $c, string $date): array
    {
        $parties  = ["50.0 / (1 + EXTRACT(EPOCH FROM (NOW() - {$date})) / 86400.0)"];
        $liaisons = [];

        if (! empty($c['ville'])) {
            $parties[]  = 'CASE WHEN m.ville ILIKE ? THEN 20 ELSE 0 END';
            $liaisons[] = $c['ville'];
        }
        if (! empty($c['localite'])) {
            $parties[]  = 'CASE WHEN m.localite ILIKE ? THEN 10 ELSE 0 END';
            $liaisons[] = $c['localite'];
        }
        if (! empty($c['reserves'])) {
            $parties[] = 'CASE WHEN pp.id IN (' . $this->marques($c['reserves']) . ') THEN 25 ELSE 0 END';
            array_push($liaisons, ...$c['reserves']);
        }
        if (! empty($c['domaines'])) {
            $parties[] = 'CASE WHEN EXISTS (SELECT 1 FROM services s WHERE s.profil_professionnel_id = pp.id '
                . 'AND s.est_actif = true AND s.domaine_id IN (' . $this->marques($c['domaines']) . ')) THEN 15 ELSE 0 END';
            array_push($liaisons, ...$c['domaines']);
        }

        $parties[] = 'LEAST((SELECT COUNT(*) FROM commentaires_publication cp WHERE cp.publication_id = publications.id) * 2, 20)';

        if (! empty($c['certifie_id'])) {
            $parties[]  = 'CASE WHEN pp.statut_certification_id = ? THEN 5 ELSE 0 END';
            $liaisons[] = $c['certifie_id'];
        }

        return [implode(' + ', $parties), $liaisons];
    }

    public function stories(array $statutsVisibles): Collection
    {
        return Publication::stories()
            ->has('medias')
            ->whereHas('prestataire.membre.user', fn ($u) => $u->whereIn('statut_compte_id', $statutsVisibles))
            ->with(self::RELATIONS)
            ->orderByDesc('date_publication')
            ->limit(30)
            ->get();
    }

    

    public function prestatairesReservesPar(int $membreId): array
    {
        return ProfilProfessionnel::whereHas('reservations', fn ($r) => $r->whereHas('client', fn ($c) => $c->whereKey($membreId)))
            ->pluck('id')
            ->all();
    }

    public function clientsDuPrestataire(int $profilId): array
    {
        return Reservation::whereHas('prestataire', fn ($p) => $p->whereKey($profilId))
            ->with('client:id')
            ->get()
            ->pluck('client.id')
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    public function domainesInteretDe(int $membreId): array
    {
        return DemandeService::where('membre_id', $membreId)->distinct()->pluck('domaine_id')->all();
    }



    private function base(): Builder
    {
        return Publication::query()
            ->with(self::RELATIONS)
            ->withCount('tousCommentaires as nb_commentaires');
    }

    private function marques(array $valeurs): string
    {
        return implode(',', array_fill(0, count($valeurs), '?'));
    }
}