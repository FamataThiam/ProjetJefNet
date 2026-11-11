<?php

namespace App\Repositories\Eloquent;

use App\Models\ProfilProfessionnel;
use App\Models\Reservation;
use App\Models\User;
use App\Repositories\Contracts\StatistiquesPlateformeRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StatistiquesPlateformeRepository implements StatistiquesPlateformeRepositoryInterface
{
   

    public function membres(CarbonInterface $debut, CarbonInterface $fin): array
    {
        $ligne = DB::table('membres')->selectRaw(
            'COUNT(*) AS total, COUNT(*) FILTER (WHERE created_at BETWEEN ? AND ?) AS nouveaux',
            [$debut, $fin]
        )->first();

        return ['total' => (int) $ligne->total, 'nouveaux' => (int) $ligne->nouveaux];
    }

    public function prestatairesActifs(): int
    {
        return ProfilProfessionnel::query()
            ->whereHas('membre.user.statutCompte', fn ($s) => $s->where('value', 'ACTIF'))
            ->whereHas('services', fn ($s) => $s->where('est_actif', true))
            ->count();
    }

    public function volumeAffaires(CarbonInterface $debut, CarbonInterface $fin): array
    {
        $ligne = $this->paiementsPayes()
            ->whereBetween('pa.date_paiement', [$debut, $fin])
            ->selectRaw('COALESCE(SUM(pa.montant), 0) AS montant, COUNT(*) AS nombre')
            ->first();

        return ['montant' => (float) $ligne->montant, 'nombre' => (int) $ligne->nombre];
    }

    public function nombreReservations(CarbonInterface $debut, CarbonInterface $fin): int
    {
        return DB::table('reservations')->whereBetween('created_at', [$debut, $fin])->count();
    }

    public function demandesParStatut(?CarbonInterface $debut = null, ?CarbonInterface $fin = null): array
    {
        return DB::table('demandes_service as d')
            ->join('code_lists as s', 's.id', '=', 'd.statut_id')
            ->when($debut && $fin, fn ($q) => $q->whereBetween('d.created_at', [$debut, $fin]))
            ->groupBy('s.value')
            ->selectRaw('s.value AS statut, COUNT(*) AS nombre')
            ->pluck('nombre', 'statut')
            ->map(fn ($n) => (int) $n)
            ->all();
    }

    public function noteMoyenne(): array
    {
        $ligne = DB::table('avis')->selectRaw('ROUND(AVG(note), 2) AS moyenne, COUNT(*) AS total')->first();

        return ['moyenne' => (float) ($ligne->moyenne ?? 0), 'total' => (int) $ligne->total];
    }

    public function certificationsParStatut(): array
    {
        return DB::table('profils_professionnels as p')
            ->join('code_lists as s', 's.id', '=', 'p.statut_certification_id')
            ->groupBy('s.value')
            ->selectRaw('s.value AS statut, COUNT(*) AS nombre')
            ->pluck('nombre', 'statut')
            ->map(fn ($n) => (int) $n)
            ->all();
    }

  
    public function evolutionMensuelle(CarbonInterface $debut): array
    {
        $mois = fn (string $colonne) => "to_char({$colonne}, 'YYYY-MM')";

        $parMois = fn (Builder $requete, string $colonne, string $valeur = 'COUNT(*)') => $requete
            ->where($colonne, '>=', $debut)
            ->groupByRaw($mois($colonne))
            ->selectRaw("{$mois($colonne)} AS mois, {$valeur} AS valeur")
            ->pluck('valeur', 'mois');

        return [
            'membres'      => $parMois(DB::table('membres'), 'created_at'),
            'prestataires' => $parMois(DB::table('profils_professionnels'), 'created_at'),
            'reservations' => $parMois(DB::table('reservations'), 'created_at'),
            'volume'       => $parMois($this->paiementsPayes(), 'pa.date_paiement', 'SUM(pa.montant)'),
        ];
    }

    public function reservationsParStatut(): array
    {
        return DB::table('reservations as r')
            ->join('code_lists as s', 's.id', '=', 'r.statut_id')
            ->groupBy('s.value')
            ->selectRaw('s.value AS statut, COUNT(*) AS nombre')
            ->pluck('nombre', 'statut')
            ->map(fn ($n) => (int) $n)
            ->all();
    }

    public function domaines(int $limite = 8): Collection
    {
        return DB::table('details_reservation as d')
            ->join('reservations as r', 'r.id', '=', 'd.reservation_id')
            ->join('services as sv', 'sv.id', '=', 'd.service_id')
            ->join('domaines as dom', 'dom.id', '=', 'sv.domaine_id')
            ->join('code_lists as s', 's.id', '=', 'r.statut_id')
            ->whereNotIn('s.value', ['REFUSEE', 'ANNULEE'])
            ->groupBy('dom.libelle')
            ->selectRaw("dom.libelle AS domaine, COUNT(DISTINCT r.id) AS reservations,
                         COALESCE(SUM(d.prix_service) FILTER (WHERE s.value = 'TERMINEE'), 0) AS montant")
            ->orderByDesc('reservations')
            ->limit($limite)
            ->get();
    }

    public function meilleursPrestataires(int $limite = 5): Collection
    {
        
        $encaisse = $this->paiementsPayes()
            ->groupBy('r.profil_professionnel_id')
            ->selectRaw('r.profil_professionnel_id AS profil_id, SUM(pa.montant) AS montant, COUNT(DISTINCT r.id) AS prestations');

        return DB::table('profils_professionnels as p')
            ->join('membres as m', 'm.id', '=', 'p.membre_id')
            ->join('users as u', 'u.id', '=', 'm.user_id')
            ->joinSub($encaisse, 'ca', 'ca.profil_id', '=', 'p.id')
            ->selectRaw('p.id, u.prenom, u.nom, p.titre_professionnel, p.note_moyenne, ca.montant, ca.prestations')
            ->orderByDesc('ca.montant')
            ->limit($limite)
            ->get();
    }

    public function moyensPaiement(): Collection
    {
        return $this->paiementsPayes()
            ->join('code_lists as mo', 'mo.id', '=', 'pa.mode_id')
            ->groupByRaw("mo.value, split_part(pa.reference_transaction, '-', 1)")
            ->selectRaw("mo.value AS mode, split_part(pa.reference_transaction, '-', 1) AS prefixe, COUNT(*) AS nombre, SUM(pa.montant) AS montant")
            ->get();
    }

    public function membresParVille(): Collection
    {
        return DB::table('membres')
            ->whereNotNull('ville')
            ->groupBy('ville')
            ->selectRaw('ville, COUNT(*) AS nombre')
            ->get();
    }

    public function besoinsNonCouverts(int $limite = 10): Collection
    {
        
        return DB::table('demandes_service as d')
            ->join('code_lists as s', 's.id', '=', 'd.statut_id')
            ->join('domaines as dom', 'dom.id', '=', 'd.domaine_id')
            ->where('s.value', 'EXPIREE')
            ->groupBy('dom.libelle', 'd.ville')
            ->selectRaw('dom.libelle AS domaine, d.ville, COUNT(*) AS nombre')
            ->orderByDesc('nombre')
            ->limit($limite)
            ->get();
    }

    public function positionsPrestataires(): Collection
    {
        return DB::table('profils_professionnels as p')
            ->join('membres as m', 'm.id', '=', 'p.membre_id')
            ->join('users as u', 'u.id', '=', 'm.user_id')
            ->join('code_lists as c', 'c.id', '=', 'p.statut_certification_id')
            ->whereNotNull('p.latitude')
            ->selectRaw('p.id, u.prenom, u.nom, p.titre_professionnel, p.latitude, p.longitude, c.value AS certification')
            ->get();
    }

    public function activite(): Collection
    {
        return DB::table('reservations as r')
            ->join('code_lists as s', 's.id', '=', 'r.statut_id')
            ->where('s.value', '!=', 'REFUSEE')
            ->groupByRaw('1, 2')
            ->selectRaw('EXTRACT(ISODOW FROM r.date_prevue)::int AS jour, EXTRACT(HOUR FROM r.heure_prevue)::int AS heure, COUNT(*) AS nombre')
            ->get();
    }

   

    public function certificationsEnAttente(): Collection
    {
        return ProfilProfessionnel::query()
            ->whereHas('statutCertification', fn ($s) => $s->where('value', 'EN_ATTENTE'))
            ->with('membre.user')
            ->orderBy('updated_at')           
            ->get();
    }

    public function especesEnRetard(int $heures = 48): Collection
    {
        return Reservation::query()
            ->whereHas('paiements', fn ($p) => $p
                ->where('created_at', '<', now()->subHours($heures))
                ->whereHas('statut', fn ($s) => $s->where('value', 'EN_ATTENTE'))
                ->whereHas('mode', fn ($m) => $m->where('value', 'ESPECES')))
            ->with(['client.user', 'prestataire.membre.user'])
            ->get();
    }

    public function derniersInscrits(int $limite = 5): Collection
    {
        return User::query()
            ->whereHas('membre')
            ->with('membre')
            ->latest()
            ->limit($limite)
            ->get();
    }

    public function annulationsRecentes(int $limite = 5): Collection
    {
        return Reservation::query()
            ->whereHas('statut', fn ($s) => $s->where('value', 'ANNULEE'))
            ->with(['client.user', 'prestataire.membre.user'])
            ->orderByDesc('date_annulation')
            ->limit($limite)
            ->get();
    }

   
    private function paiementsPayes(): Builder
    {
        return DB::table('paiements as pa')
            ->join('reservations as r', 'r.id', '=', 'pa.reservation_id')
            ->join('code_lists as sp', 'sp.id', '=', 'pa.statut_id')
            ->where('sp.value', 'PAYEE');
    }
}