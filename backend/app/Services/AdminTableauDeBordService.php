<?php

namespace App\Services;

use App\Models\ProfilProfessionnel;
use App\Models\Reservation;
use App\Models\User;
use App\Repositories\Contracts\StatistiquesPlateformeRepositoryInterface;
use App\Support\Geo;
use Illuminate\Support\Str;

class AdminTableauDeBordService
{
    private const STATUTS_RESERVATION = [
        'EN_ATTENTE' => 'En attente', 'CONFIRMEE' => 'Confirmées', 'EN_COURS' => 'En cours',
        'TERMINEE'   => 'Terminées',  'ANNULEE'   => 'Annulées',   'REFUSEE'  => 'Refusées',
    ];

    private const JOURS = [1 => 'Lun', 2 => 'Mar', 3 => 'Mer', 4 => 'Jeu', 5 => 'Ven', 6 => 'Sam', 7 => 'Dim'];

    public function __construct(private StatistiquesPlateformeRepositoryInterface $stats) {}

   

    public function resume(): array
    {
        $debut     = now()->startOfMonth();
        $fin       = now();
        $debutPrec = now()->subMonthNoOverflow()->startOfMonth();
        $finPrec   = now()->subMonthNoOverflow()->endOfMonth();

        $membres     = $this->stats->membres($debut, $fin);
        $membresPrec = $this->stats->membres($debutPrec, $finPrec);
        $volume      = $this->stats->volumeAffaires($debut, $fin);
        $volumePrec  = $this->stats->volumeAffaires($debutPrec, $finPrec);
        $note        = $this->stats->noteMoyenne();
        $certifs     = $this->stats->certificationsParStatut();
        $totalProfils = array_sum($certifs);

        return [
            'periode' => [
                'libelle' => ucfirst(now()->locale('fr')->translatedFormat('F Y')),
                'debut'   => $debut->toDateString(),
                'fin'     => $fin->toDateString(),
            ],
            'cartes' => [
                $this->carte('membres', 'Membres inscrits', $membres['total'], null, null,
                    complement: "+{$membres['nouveaux']} ce mois (" . $membresPrec['nouveaux'] . ' le mois dernier)'),
                $this->carte('prestataires', 'Prestataires actifs', $this->stats->prestatairesActifs(), null, null),
                $this->carte('volume', "Volume d'affaires du mois", $volume['montant'], $volumePrec['montant'], 'FCFA'),
                $this->carte('reservations', 'Réservations du mois',
                    $this->stats->nombreReservations($debut, $fin),
                    $this->stats->nombreReservations($debutPrec, $finPrec), null),
                $this->carte('conversion', 'Taux de conversion des demandes',
                    $this->tauxConversion($this->stats->demandesParStatut($debut, $fin)),
                    $this->tauxConversion($this->stats->demandesParStatut($debutPrec, $finPrec)), '%'),
                $this->carte('note', 'Note moyenne de la plateforme', $note['moyenne'], null, '/ 5',
                    complement: "{$note['total']} avis"),
                $this->carte('certification', 'Prestataires certifiés',
                    $totalProfils ? round(($certifs['CERTIFIE'] ?? 0) / $totalProfils * 100, 1) : 0, null, '%',
                    complement: ($certifs['CERTIFIE'] ?? 0) . " sur {$totalProfils}"),
                $this->carte('a_traiter', 'Certifications en attente', $certifs['EN_ATTENTE'] ?? 0, null, null,
                    alerte: ($certifs['EN_ATTENTE'] ?? 0) > 0),
            ],
        ];
    }

    
    public function evolution(int $nombreMois = 12): array
    {
        $nombreMois = max(3, min(24, $nombreMois));
        $debut      = now()->startOfMonth()->subMonthsNoOverflow($nombreMois - 1);
        $donnees    = $this->stats->evolutionMensuelle($debut);

        $mois = [];
        for ($i = 0; $i < $nombreMois; $i++) {
            $date = $debut->copy()->addMonthsNoOverflow($i);
            $cle  = $date->format('Y-m');

            $mois[] = [
                'mois'                => $cle,
                'libelle'             => $date->locale('fr')->translatedFormat('M Y'),
                'nouveaux_membres'    => (int) ($donnees['membres'][$cle] ?? 0),
                'nouveaux_prestataires' => (int) ($donnees['prestataires'][$cle] ?? 0),
                'reservations'        => (int) ($donnees['reservations'][$cle] ?? 0),
                'volume_affaires'     => (float) ($donnees['volume'][$cle] ?? 0),
            ];
        }

        return ['nombre_mois' => $nombreMois, 'mois' => $mois];
    }

    

    public function repartitions(): array
    {
        $statuts = [];
        foreach ($this->stats->reservationsParStatut() as $statut => $nombre) {
            $statuts[] = ['statut' => $statut, 'libelle' => self::STATUTS_RESERVATION[$statut] ?? $statut, 'valeur' => $nombre];
        }

        $domaines = $this->stats->domaines()->map(fn ($d) => [
            'libelle'      => $d->domaine,
            'reservations' => (int) $d->reservations,
            'montant'      => (float) $d->montant,
        ])->all();

        $classement = $this->stats->meilleursPrestataires()->values()->map(fn ($p, $i) => [
            'rang'        => $i + 1,
            'id'          => $p->id,
            'nom'         => "{$p->prenom} " . mb_substr($p->nom, 0, 1) . '.',
            'titre'       => $p->titre_professionnel,
            'note'        => round((float) $p->note_moyenne, 1),
            'montant'     => (float) $p->montant,
            'prestations' => (int) $p->prestations,
        ])->all();

        $moyens = $this->stats->moyensPaiement()
            ->groupBy(fn ($m) => $this->libelleMoyen($m->mode, $m->prefixe))
            ->map(fn ($g, $libelle) => ['libelle' => $libelle, 'valeur' => (int) $g->sum('nombre'), 'montant' => (float) $g->sum('montant')])
            ->values()->all();

        
        $regions = $this->stats->membresParVille()
            ->groupBy(fn ($v) => $this->regionDe($v->ville))
            ->map(fn ($g, $region) => ['libelle' => $region, 'valeur' => (int) $g->sum('nombre')])
            ->sortByDesc('valeur')->values()->all();

        return [
            'reservations_par_statut' => $statuts,
            'domaines'                => $domaines,
            'meilleurs_prestataires'  => $classement,
            'moyens_paiement'         => $moyens,
            'membres_par_region'      => $regions,
            'activite'                => $this->activite(),
        ];
    }

    

    public function marche(): array
    {
        $d = $this->stats->demandesParStatut();
        $total = array_sum($d);

        $acceptees = ($d['ACCEPTEE'] ?? 0) + ($d['CONCLUE'] ?? 0);
        $etapes = [
            ['libelle' => 'Demandes publiées', 'valeur' => $total],
            ['libelle' => 'Acceptées par un prestataire', 'valeur' => $acceptees],
            ['libelle' => 'Conclues (prestation terminée)', 'valeur' => $d['CONCLUE'] ?? 0],
        ];
        foreach ($etapes as &$etape) {
            $etape['pourcentage'] = $total ? round($etape['valeur'] / $total * 100, 1) : 0;
        }

        return [
            'entonnoir_demandes' => $etapes,
            'demandes_perdues'   => [
                'expirees'   => $d['EXPIREE'] ?? 0,
                'annulees'   => $d['ANNULEE'] ?? 0,
                'en_attente' => $d['EN_ATTENTE'] ?? 0,
            ],
            'besoins_non_couverts' => $this->stats->besoinsNonCouverts()->map(fn ($b) => [
                'domaine' => $b->domaine,
                'ville'   => $b->ville,
                'nombre'  => (int) $b->nombre,
                'texte'   => "{$b->domaine} à {$b->ville} : {$b->nombre} demande(s) sans prestataire",
            ])->all(),
            'carte_prestataires' => $this->stats->positionsPrestataires()->map(fn ($p) => [
                'id'       => $p->id,
                'nom'      => "{$p->prenom} " . mb_substr($p->nom, 0, 1) . '.',
                'titre'    => $p->titre_professionnel,
                'certifie' => $p->certification === 'CERTIFIE',
                'position' => ['lat' => Geo::approximer((float) $p->latitude), 'lng' => Geo::approximer((float) $p->longitude)],
            ])->all(),
        ];
    }

  

    public function aTraiter(): array
    {
        return [
            'certifications_en_attente' => $this->stats->certificationsEnAttente()->map(fn (ProfilProfessionnel $p) => [
                'profil_id'   => $p->id,
                'prestataire' => "{$p->membre->user->prenom} {$p->membre->user->nom}",
                'titre'       => $p->titre_professionnel,
                'demande_le'  => $p->updated_at?->toIso8601String(),
                'il_y_a'      => $p->updated_at?->locale('fr')->diffForHumans(),
            ])->all(),
            'especes_en_retard' => $this->stats->especesEnRetard()->map(fn (Reservation $r) => [
                'reservation' => $r->uuid,
                'client'      => $this->nomCourt($r->client?->user),
                'prestataire' => $this->nomCourt($r->prestataire?->membre?->user),
                'montant'     => (float) $r->prix_final,
            ])->all(),
            'derniers_inscrits' => $this->stats->derniersInscrits()->map(fn (User $u) => [
                'nom'      => "{$u->prenom} {$u->nom}",
                'ville'    => $u->membre?->ville,
                'inscrit_le' => $u->created_at?->toIso8601String(),
                'il_y_a'   => $u->created_at?->locale('fr')->diffForHumans(),
            ])->all(),
            'annulations_recentes' => $this->stats->annulationsRecentes()->map(fn (Reservation $r) => [
                'reservation' => $r->uuid,
                'client'      => $this->nomCourt($r->client?->user),
                'prestataire' => $this->nomCourt($r->prestataire?->membre?->user),
                'motif'       => $r->raison_annulation,
                'annulee_le'  => $r->date_annulation?->toIso8601String(),
            ])->all(),
        ];
    }

   

    private function activite(): array
    {
        $grille = array_fill(1, 7, array_fill(0, 24, 0));
        foreach ($this->stats->activite() as $l) {
            $grille[$l->jour][$l->heure] = (int) $l->nombre;
        }

        $parJour = [];
        $chaleur = [];
        foreach (self::JOURS as $num => $libelle) {
            $parJour[] = ['jour' => $libelle, 'valeur' => array_sum($grille[$num])];
            $chaleur[] = ['jour' => $libelle, 'heures' => array_values($grille[$num])];
        }

        return ['par_jour' => $parJour, 'carte_chaleur' => $chaleur];
    }

    private function carte(string $cle, string $libelle, $valeur, $precedent, ?string $unite,
                           ?string $complement = null, bool $alerte = false): array
    {
        $variation = ($precedent !== null && (float) $precedent != 0.0 && $valeur !== null)
            ? round(($valeur - $precedent) / abs($precedent) * 100, 1)
            : null;

        return [
            'cle'        => $cle,
            'libelle'    => $libelle,
            'valeur'     => $valeur,
            'unite'      => $unite,
            'precedent'  => $precedent,
            'variation'  => $variation,
            'tendance'   => $variation === null || $variation == 0.0 ? 'stable' : ($variation > 0 ? 'hausse' : 'baisse'),
            'complement' => $complement,
            'alerte'     => $alerte,
        ];
    }

 
    private function tauxConversion(array $statuts): ?float
    {
        $total = array_sum($statuts);

        return $total ? round((($statuts['ACCEPTEE'] ?? 0) + ($statuts['CONCLUE'] ?? 0)) / $total * 100, 1) : null;
    }

   
    private function regionDe(?string $ville): string
    {
        $cle = Str::lower(Str::ascii(trim((string) $ville)));

        foreach (config('zones.regions') as $region => $villes) {
            foreach ($villes as $v) {
                if (Str::lower(Str::ascii($v)) === $cle) {
                    return $region;
                }
            }
        }

        return 'Autres';
    }

    private function libelleMoyen(string $mode, ?string $prefixe): string
    {
        return match ($mode) {
            'MOBILE_MONEY' => ['WAVE' => 'Wave', 'OM' => 'Orange Money', 'FREE' => 'Free Money'][$prefixe] ?? 'Mobile Money',
            'CARTE'        => 'Carte bancaire',
            'ESPECES'      => 'Espèces',
            'VIREMENT'     => 'Virement',
            default        => $mode,
        };
    }

    private function nomCourt(?User $user): string
    {
        return $user ? "{$user->prenom} " . mb_substr($user->nom, 0, 1) . '.' : '—';
    }
}