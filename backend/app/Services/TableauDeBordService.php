<?php

namespace App\Services;

use App\Exceptions\ProfilProException;
use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Models\Reservation;
use App\Repositories\Contracts\AvisRepositoryInterface;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use App\Repositories\Contracts\StatistiquesPrestataireRepositoryInterface;
use Illuminate\Support\Carbon;

class TableauDeBordService
{
    private const STATUTS = [
        'EN_ATTENTE' => 'En attente',
        'CONFIRMEE'  => 'Confirmées',
        'EN_COURS'   => 'En cours',
        'TERMINEE'   => 'Terminées',
        'ANNULEE'    => 'Annulées',
        'REFUSEE'    => 'Refusées',
    ];

    private const JOURS = [1 => 'Lun', 2 => 'Mar', 3 => 'Mer', 4 => 'Jeu', 5 => 'Ven', 6 => 'Sam', 7 => 'Dim'];

    public function __construct(
        private StatistiquesPrestataireRepositoryInterface $stats,
        private ProfilProfessionnelRepositoryInterface $profils,
        private AvisRepositoryInterface $avis,
        private DemandesDisponiblesService $demandes,
    ) {}

    /* =========================================================
     |  1. RÉSUMÉ : les 8 cartes chiffres clés
     * ========================================================= */

    public function resume(Membre $membre): array
    {
        $profil = $this->profilDe($membre);

        $debut     = now()->startOfMonth();
        $fin       = now();
        $debutPrec = now()->subMonthNoOverflow()->startOfMonth();
        $finPrec   = now()->subMonthNoOverflow()->endOfMonth();

        $ca     = $this->stats->chiffreAffaires($profil->id, $debut, $fin);
        $caPrec = $this->stats->chiffreAffaires($profil->id, $debutPrec, $finPrec);

        $realisees     = $this->stats->parStatut($profil->id, $debut, $fin, 'r.date_prevue');
        $realiseesPrec = $this->stats->parStatut($profil->id, $debutPrec, $finPrec, 'r.date_prevue');

        $recues     = $this->stats->parStatut($profil->id, $debut, $fin);
        $recuesPrec = $this->stats->parStatut($profil->id, $debutPrec, $finPrec);

        $clients = $this->stats->clients($profil->id);
        $serie   = $this->evolution($membre, 6)['mois'];

        return [
            'periode' => [
                'libelle' => ucfirst(now()->locale('fr')->translatedFormat('F Y')),
                'debut'   => $debut->toDateString(),
                'fin'     => $fin->toDateString(),
            ],
            'cartes' => [
                $this->carte('chiffre_affaires', "Chiffre d'affaires du mois", $ca['montant'], $caPrec['montant'], 'FCFA',
                    serie: array_column($serie, 'chiffre_affaires')),
                $this->carte('prestations', 'Prestations terminées', $realisees['TERMINEE'] ?? 0, $realiseesPrec['TERMINEE'] ?? 0, null,
                    serie: array_column($serie, 'prestations')),
                $this->carte('note', 'Note moyenne', round((float) $profil->note_moyenne, 2), null, '/ 5',
                    complement: $this->avis->statistiques($profil->id)['total'] . ' avis'),
                $this->carte('acceptation', "Taux d'acceptation", $this->tauxAcceptation($recues), $this->tauxAcceptation($recuesPrec), '%'),
                $this->carte('panier_moyen', 'Panier moyen', $ca['nombre'] ? round($ca['montant'] / $ca['nombre']) : 0,
                    $caPrec['nombre'] ? round($caPrec['montant'] / $caPrec['nombre']) : null, 'FCFA'),
                $this->carte('clients', 'Clients servis', $clients['total'], null, null,
                    complement: "dont {$clients['fideles']} fidèle(s)"),
                $this->carte('reactivite', 'Délai moyen de confirmation',
                    $delai = $this->stats->delaiConfirmation($profil->id, $debut, $fin),
                    $this->stats->delaiConfirmation($profil->id, $debutPrec, $finPrec), 'min',
                    complement: $this->dureeLisible($delai), plusBasEstMieux: true),
                $this->carte('annulation', "Taux d'annulation", $this->taux($recues, 'ANNULEE'), $this->taux($recuesPrec, 'ANNULEE'), '%',
                    plusBasEstMieux: true),
            ],
        ];
    }

    /* =========================================================
     |  2. ÉVOLUTION : les courbes mois par mois
     * ========================================================= */

    public function evolution(Membre $membre, int $nombreMois = 12): array
    {
        $profil     = $this->profilDe($membre);
        $nombreMois = max(3, min(24, $nombreMois));
        $debut      = now()->startOfMonth()->subMonthsNoOverflow($nombreMois - 1);
        $donnees    = $this->stats->evolutionMensuelle($profil->id, $debut);

        $mois = [];
        for ($i = 0; $i < $nombreMois; $i++) {
            $date = $debut->copy()->addMonthsNoOverflow($i);
            $cle  = $date->format('Y-m');

            // Les mois sans activité valent 0 (ou null pour la note) : la courbe reste continue
            $mois[] = [
                'mois'                => $cle,
                'libelle'             => $date->locale('fr')->translatedFormat('M Y'),
                'chiffre_affaires'    => (float) ($donnees['ca'][$cle] ?? 0),
                'prestations'         => (int) ($donnees['prestations'][$cle] ?? 0),
                'reservations_recues' => (int) ($donnees['recues'][$cle] ?? 0),
                'note'                => isset($donnees['note'][$cle]) ? (float) $donnees['note'][$cle] : null,
            ];
        }

        return ['nombre_mois' => $nombreMois, 'mois' => $mois];
    }

    /* =========================================================
     |  3. RÉPARTITIONS : anneaux et camemberts
     * ========================================================= */

    public function repartitions(Membre $membre): array
    {
        $profil = $this->profilDe($membre);

        // Statuts (depuis le début)
        $statuts = [];
        foreach ($this->stats->parStatut($profil->id) as $statut => $nombre) {
            $statuts[] = ['statut' => $statut, 'libelle' => self::STATUTS[$statut] ?? $statut, 'valeur' => $nombre];
        }

        // Chiffre d'affaires par service : les 5 premiers + « Autres »
        $services = $this->stats->chiffreAffairesParService($profil->id);
        $top      = $services->take(5)->map(fn ($s) => [
            'libelle' => $s->service, 'valeur' => (float) $s->montant, 'nombre' => (int) $s->nombre,
        ])->values()->all();
        if ($services->count() > 5) {
            $reste = $services->slice(5);
            $top[] = ['libelle' => 'Autres', 'valeur' => (float) $reste->sum('montant'), 'nombre' => (int) $reste->sum('nombre')];
        }

        // Moyens de paiement (Wave, Orange Money…), regroupés par libellé
        $moyens = $this->stats->moyensPaiement($profil->id)
            ->groupBy(fn ($m) => $this->libelleMoyen($m->mode, $m->prefixe))
            ->map(fn ($groupe, $libelle) => [
                'libelle' => $libelle,
                'valeur'  => (int) $groupe->sum('nombre'),
                'montant' => (float) $groupe->sum('montant'),
            ])->values()->all();

        // Notes de 5 à 1
        $notes = [];
        foreach ($this->avis->statistiques($profil->id)['repartition'] as $note => $nombre) {
            $notes[] = ['libelle' => "{$note} ★", 'note' => $note, 'valeur' => $nombre];
        }

        $zones = $this->stats->originesClients($profil->id)
            ->map(fn ($z) => ['libelle' => $z->zone, 'valeur' => (int) $z->nombre])->all();

        return [
            'statuts'          => $statuts,
            'services'         => $top,
            'moyens_paiement'  => $moyens,
            'notes'            => $notes,
            'zones_clients'    => $zones,
        ];
    }

    /* =========================================================
     |  4. ACTIVITÉ : barres par jour + carte de chaleur
     * ========================================================= */

    public function activite(Membre $membre): array
    {
        $profil = $this->profilDe($membre);
        $lignes = $this->stats->activite($profil->id);

        // Grille 7 jours × 24 heures remplie de zéros
        $grille = array_fill(1, 7, array_fill(0, 24, 0));
        foreach ($lignes as $l) {
            $grille[$l->jour][$l->heure] = (int) $l->nombre;
        }

        $parJour = [];
        $chaleur = [];
        foreach (self::JOURS as $num => $libelle) {
            $parJour[] = ['jour' => $libelle, 'valeur' => array_sum($grille[$num])];
            $chaleur[] = ['jour' => $libelle, 'heures' => array_values($grille[$num])];
        }

        $meilleur = collect($parJour)->sortByDesc('valeur')->first();

        return [
            'par_jour'      => $parJour,
            'carte_chaleur' => $chaleur,
            'meilleur_jour' => ($meilleur['valeur'] ?? 0) > 0 ? $meilleur['jour'] : null,
        ];
    }

    /* =========================================================
     |  5. ENTONNOIR
     * ========================================================= */

    public function entonnoir(Membre $membre): array
    {
        $profil = $this->profilDe($membre);
        $e      = $this->stats->entonnoir($profil->id);

        $etapes = [
            ['cle' => 'recues',          'libelle' => 'Réservations reçues'],
            ['cle' => 'confirmees',      'libelle' => 'Confirmées'],
            ['cle' => 'terminees',       'libelle' => 'Terminées'],
            ['cle' => 'payees',          'libelle' => 'Payées'],
            ['cle' => 'rapports_signes', 'libelle' => 'Rapport signé'],
            ['cle' => 'notees',          'libelle' => 'Notées par le client'],
        ];

        $total     = max(1, $e['recues']);
        $precedent = null;

        foreach ($etapes as &$etape) {
            $valeur              = $e[$etape['cle']];
            $etape['valeur']     = $valeur;
            $etape['pourcentage'] = round($valeur / $total * 100, 1);
            $etape['perte']      = $precedent !== null ? $precedent - $valeur : 0;
            $precedent           = $valeur;
        }

        return ['etapes' => $etapes];
    }

    /* =========================================================
     |  6. À FAIRE
     * ========================================================= */

    public function aFaire(Membre $membre): array
    {
        $profil = $this->profilDe($membre);

        return [
            'reservations_a_confirmer' => $this->stats->reservationsAConfirmer($profil->id)->map(fn ($r) => $this->resumeReservation($r))->all(),
            'especes_a_confirmer'      => $this->stats->especesAConfirmer($profil->id)->map(fn ($r) => $this->resumeReservation($r))->all(),
            'rapports_a_rediger'       => $this->stats->rapportsARediger($profil->id)->map(fn ($r) => $this->resumeReservation($r))->all(),
            'prochaines_interventions' => $this->stats->prochainesInterventions($profil->id)->map(fn ($r) => $this->resumeReservation($r))->all(),
            'derniers_avis'            => $this->stats->derniersAvis($profil->id)->map(fn ($a) => [
                'note'        => $a->note,
                'commentaire' => $a->commentaire,
                'auteur'      => $this->nomCourt($a->reservation->membre),
                'il_y_a'      => $a->created_at->locale('fr')->diffForHumans(),
            ])->all(),
            'demandes_disponibles'     => $this->demandes->lister($membre)->total(),
        ];
    }

    /* =========================================================
     |  OUTILS
     * ========================================================= */

    private function profilDe(Membre $membre): ProfilProfessionnel
    {
        return $this->profils->trouverParMembre($membre->id)
            ?? throw ProfilProException::pasPrestataire();
    }

    /** Une carte : valeur, valeur du mois précédent, variation en %, tendance, mini-courbe. */
    private function carte(string $cle, string $libelle, $valeur, $precedent, ?string $unite,
                           ?string $complement = null, array $serie = [], bool $plusBasEstMieux = false): array
    {
        $variation = ($precedent !== null && (float) $precedent != 0.0 && $valeur !== null)
            ? round(($valeur - $precedent) / abs($precedent) * 100, 1)
            : null;

        $tendance = match (true) {
            $variation === null || $variation == 0.0 => 'stable',
            $variation > 0                           => 'hausse',
            default                                  => 'baisse',
        };

        return [
            'cle'        => $cle,
            'libelle'    => $libelle,
            'valeur'     => $valeur,
            'unite'      => $unite,
            'precedent'  => $precedent,
            'variation'  => $variation,
            'tendance'   => $tendance,
            // Pour le délai ou l'annulation, une baisse est une bonne nouvelle (flèche verte)
            'favorable'  => $tendance === 'stable' ? null : (($tendance === 'hausse') xor $plusBasEstMieux),
            'complement' => $complement,
            'serie'      => $serie,
        ];
    }

    private function tauxAcceptation(array $statuts): ?float
    {
        $acceptees = ($statuts['CONFIRMEE'] ?? 0) + ($statuts['EN_COURS'] ?? 0) + ($statuts['TERMINEE'] ?? 0);
        $refusees  = $statuts['REFUSEE'] ?? 0;

        return ($acceptees + $refusees) > 0 ? round($acceptees / ($acceptees + $refusees) * 100, 1) : null;
    }

    private function taux(array $statuts, string $statut): ?float
    {
        $total = array_sum($statuts);

        return $total > 0 ? round(($statuts[$statut] ?? 0) / $total * 100, 1) : null;
    }

    private function dureeLisible(?float $minutes): ?string
    {
        if ($minutes === null) {
            return null;
        }

        $m = (int) round($minutes);

        return $m < 60 ? "environ {$m} min" : sprintf('environ %d h %02d', intdiv($m, 60), $m % 60);
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

    private function resumeReservation(Reservation $r): array
    {
        return [
            'id'       => $r->uuid,
            'client'   => $this->nomCourt($r->client),
            'date'     => $r->date_prevue?->format('Y-m-d'),
            'heure'    => substr((string) $r->heure_prevue, 0, 5),
            'prix'     => (float) $r->prix_final,
            'services' => $r->relationLoaded('details') ? $r->details->map(fn ($d) => $d->service?->nom)->filter()->values()->all() : [],
        ];
    }

    private function nomCourt(?Membre $membre): string
    {
        if (! $membre?->user) {
            return 'Client';
        }

        return "{$membre->user->prenom} " . mb_substr($membre->user->nom, 0, 1) . '.';
    }
}