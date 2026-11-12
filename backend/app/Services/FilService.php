<?php

namespace App\Services;

use App\Models\Avis;
use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Repositories\Contracts\PublicationRepositoryInterface;
use App\Support\CodeListe;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class FilService
{
    private const RAYON_DEFAUT_KM = 5;
    private const JOURS_CARTES    = 14;

    public function __construct(private PublicationRepositoryInterface $publications) {}

    /**
     * Le fil d'actualité.
     * @return array{0: LengthAwarePaginator, 1: array} les publications + les cartes automatiques
     */
    public function fil(Membre $membre, array $params): array
    {
        $onglet   = $params['onglet'] ?? 'pour-vous';
        $reserves = $this->publications->prestatairesReservesPar($membre->id);

        $page = $this->publications->fil([
            'onglet'           => $onglet,
            'ville'            => $membre->ville,
            'localite'         => $membre->localite,
            'reserves'         => $reserves,
            'domaines'         => $this->publications->domainesInteretDe($membre->id),
            'certifie_id'      => CodeListe::id('StatutProfil', 'CERTIFIE'),
            'statuts_visibles' => $this->statutsVisibles(),
            'lat'              => $params['lat'] ?? null,
            'lng'              => $params['lng'] ?? null,
            'rayon_km'         => $params['rayon'] ?? self::RAYON_DEFAUT_KM,
        ]);

    
        $page->getCollection()->each(
            fn ($p) => $p->setAttribute('deja_reserve', in_array($p->profil_professionnel_id, $reserves, true))
        );

   
        $cartes = ($onglet === 'pour-vous' && $page->currentPage() === 1)
            ? ['prestations_reussies' => $this->prestationsReussies(), 'nouveaux_certifies' => $this->nouveauxCertifies()]
            : ['prestations_reussies' => [], 'nouveaux_certifies' => []];

        return [$page, $cartes];
    }

    public function stories(): Collection
    {
        return $this->publications->stories($this->statutsVisibles());
    }

   
    private function prestationsReussies(): array
    {
        return Avis::query()
            ->where('note', '>=', 4)
            ->where('created_at', '>=', now()->subDays(self::JOURS_CARTES))
            ->with(['reservation.prestataire.membre.user', 'reservation.client.user', 'reservation.details.service'])
            ->latest()
            ->limit(3)
            ->get()
            ->filter(fn ($a) => $a->reservation?->prestataire?->membre?->user)
            ->map(function ($a) {
                $profil = $a->reservation->prestataire;
                $membre = $profil->membre;

                return [
                    'avis_id'     => $a->id,
                    'prestataire' => [
                        'profil_id' => $profil->id,
                        'nom'       => trim($membre->user->prenom . ' ' . $membre->user->nom),
                        'titre'     => $profil->titre_professionnel,
                        'ville'     => $membre->ville,
                    ],
                    'service'     => $a->reservation->details->first()?->service?->nom,
                    'note'        => (int) $a->note,
                    'commentaire' => $a->commentaire,
                    'client'      => $this->nomCourt($a->reservation->client?->user),   // "Assane F."
                    'il_y_a'      => $a->created_at?->locale('fr')->diffForHumans(),
                ];
            })
            ->values()
            ->all();
    }

   
    private function nouveauxCertifies(): array
    {
        return ProfilProfessionnel::query()
            ->whereHas('statutCertification', fn ($s) => $s->where('value', 'CERTIFIE'))
            ->where('certification_traitee_le', '>=', now()->subDays(self::JOURS_CARTES))
            ->with('membre.user')
            ->orderByDesc('certification_traitee_le')
            ->limit(3)
            ->get()
            ->map(fn ($p) => [
                'profil_id'   => $p->id,
                'nom'         => trim($p->membre->user->prenom . ' ' . $p->membre->user->nom),
                'titre'       => $p->titre_professionnel,
                'ville'       => $p->membre->ville,
                'certifie_le' => $p->certification_traitee_le?->toIso8601String(),
                'il_y_a'      => $p->certification_traitee_le?->locale('fr')->diffForHumans(),
            ])
            ->all();
    }

   
    private function statutsVisibles(): array
    {
        return [CodeListe::id('StatutCompte', 'ACTIF'), CodeListe::id('StatutCompte', 'SIGNALE')];
    }

    private function nomCourt($user): ?string
    {
        return $user ? trim($user->prenom . ' ' . mb_substr((string) $user->nom, 0, 1) . '.') : null;
    }
}