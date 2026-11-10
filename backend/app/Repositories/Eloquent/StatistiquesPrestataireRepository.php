<?php

namespace App\Repositories\Eloquent;

use App\Models\Avis;
use App\Models\Reservation;
use App\Repositories\Contracts\StatistiquesPrestataireRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StatistiquesPrestataireRepository implements StatistiquesPrestataireRepositoryInterface
{
    

    public function chiffreAffaires(int $profilId, CarbonInterface $debut, CarbonInterface $fin): array
    {
        $ligne = $this->paiementsPayes($profilId)
            ->whereBetween('pa.date_paiement', [$debut, $fin])
            ->selectRaw('COALESCE(SUM(pa.montant), 0) AS montant, COUNT(*) AS nombre')
            ->first();

        return ['montant' => (float) $ligne->montant, 'nombre' => (int) $ligne->nombre];
    }

    public function parStatut(int $profilId, ?CarbonInterface $debut = null, ?CarbonInterface $fin = null, string $colonneDate = 'r.created_at'): array
    {
        return $this->reservations($profilId)
            ->when($debut && $fin, fn ($q) => $q->whereBetween($colonneDate, [$debut, $fin]))
            ->groupBy('s.value')
            ->selectRaw('s.value AS statut, COUNT(*) AS nombre')
            ->pluck('nombre', 'statut')
            ->map(fn ($n) => (int) $n)
            ->all();
    }

    public function clients(int $profilId): array
    {
      
        $parClient = $this->reservations($profilId)
            ->where('s.value', 'TERMINEE')
            ->groupBy('r.membre_id')
            ->selectRaw('r.membre_id, COUNT(*) AS n');

        $ligne = DB::query()->fromSub($parClient, 'c')
            ->selectRaw('COUNT(*) AS total, COUNT(*) FILTER (WHERE n >= 2) AS fideles')
            ->first();

        return ['total' => (int) $ligne->total, 'fideles' => (int) $ligne->fideles];
    }

    public function delaiConfirmation(int $profilId, CarbonInterface $debut, CarbonInterface $fin): ?float
    {
        
        $minutes = DB::table('reservations as r')
            ->where('r.profil_professionnel_id', $profilId)
            ->whereNull('r.demande_service_id')
            ->whereNotNull('r.date_confirmation')
            ->whereBetween('r.created_at', [$debut, $fin])
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (r.date_confirmation - r.created_at)) / 60) AS minutes')
            ->value('minutes');

        return $minutes !== null ? round((float) $minutes, 1) : null;
    }

    

    public function evolutionMensuelle(int $profilId, CarbonInterface $debut): array
    {
        $mois = fn (string $colonne) => "to_char({$colonne}, 'YYYY-MM')";

        $ca = $this->paiementsPayes($profilId)
            ->where('pa.date_paiement', '>=', $debut)
            ->groupByRaw($mois('pa.date_paiement'))
            ->selectRaw("{$mois('pa.date_paiement')} AS mois, SUM(pa.montant) AS valeur")
            ->pluck('valeur', 'mois');

        $prestations = $this->reservations($profilId)
            ->where('s.value', 'TERMINEE')
            ->where('r.date_prevue', '>=', $debut)
            ->groupByRaw($mois('r.date_prevue'))
            ->selectRaw("{$mois('r.date_prevue')} AS mois, COUNT(*) AS valeur")
            ->pluck('valeur', 'mois');

        $recues = $this->reservations($profilId)
            ->where('r.created_at', '>=', $debut)
            ->groupByRaw($mois('r.created_at'))
            ->selectRaw("{$mois('r.created_at')} AS mois, COUNT(*) AS valeur")
            ->pluck('valeur', 'mois');

        $note = DB::table('avis as a')
            ->join('reservations as r', 'r.id', '=', 'a.reservation_id')
            ->where('r.profil_professionnel_id', $profilId)
            ->where('a.created_at', '>=', $debut)
            ->groupByRaw($mois('a.created_at'))
            ->selectRaw("{$mois('a.created_at')} AS mois, ROUND(AVG(a.note), 2) AS valeur")
            ->pluck('valeur', 'mois');

        return compact('ca', 'prestations', 'recues', 'note');
    }

    public function chiffreAffairesParService(int $profilId): Collection
    {
        return DB::table('details_reservation as d')
            ->join('reservations as r', 'r.id', '=', 'd.reservation_id')
            ->join('services as sv', 'sv.id', '=', 'd.service_id')
            ->join('code_lists as s', 's.id', '=', 'r.statut_id')
            ->where('r.profil_professionnel_id', $profilId)
            ->where('s.value', 'TERMINEE')
            ->groupBy('sv.nom')
            ->selectRaw('sv.nom AS service, SUM(d.prix_service) AS montant, COUNT(*) AS nombre')
            ->orderByDesc('montant')
            ->get();
    }

    public function moyensPaiement(int $profilId): Collection
    {
    
        return $this->paiementsPayes($profilId)
            ->join('code_lists as m', 'm.id', '=', 'pa.mode_id')
            ->groupByRaw("m.value, split_part(pa.reference_transaction, '-', 1)")
            ->selectRaw("m.value AS mode, split_part(pa.reference_transaction, '-', 1) AS prefixe, COUNT(*) AS nombre, SUM(pa.montant) AS montant")
            ->get();
    }

    public function originesClients(int $profilId, int $limite = 6): Collection
    {
        $zone = "COALESCE(NULLIF(m.localite, ''), m.ville, 'Inconnu')";

        return $this->reservations($profilId)
            ->join('membres as m', 'm.id', '=', 'r.membre_id')
            ->whereNotIn('s.value', ['REFUSEE'])
            ->groupByRaw($zone)
            ->selectRaw("{$zone} AS zone, COUNT(*) AS nombre")
            ->orderByDesc('nombre')
            ->limit($limite)
            ->get();
    }

    public function activite(int $profilId): Collection
    {
        return $this->reservations($profilId)
            ->whereNotIn('s.value', ['REFUSEE'])
            ->groupByRaw('1, 2')
            ->selectRaw('EXTRACT(ISODOW FROM r.date_prevue)::int AS jour, EXTRACT(HOUR FROM r.heure_prevue)::int AS heure, COUNT(*) AS nombre')
            ->get();
    }

    public function entonnoir(int $profilId): array
    {
        $ligne = $this->reservations($profilId)->selectRaw("
            COUNT(*) AS recues,
            COUNT(*) FILTER (WHERE r.date_confirmation IS NOT NULL) AS confirmees,
            COUNT(*) FILTER (WHERE s.value = 'TERMINEE') AS terminees,
            COUNT(*) FILTER (WHERE s.value = 'TERMINEE' AND EXISTS (
                SELECT 1 FROM paiements pa JOIN code_lists sp ON sp.id = pa.statut_id
                WHERE pa.reservation_id = r.id AND sp.value = 'PAYEE'
            )) AS payees,
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM rapports_prestation rp
                WHERE rp.reservation_id = r.id AND rp.date_signature_client IS NOT NULL
            )) AS rapports_signes,
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM avis a WHERE a.reservation_id = r.id
            )) AS notees
        ")->first();

        return array_map('intval', (array) $ligne);
    }

    

    public function reservationsAConfirmer(int $profilId, int $limite = 5): Collection
    {
        return $this->reservationsAuStatut($profilId, 'EN_ATTENTE')
            ->orderBy('date_prevue')->orderBy('heure_prevue')
            ->limit($limite)->get();
    }

    public function especesAConfirmer(int $profilId): Collection
    {
        return Reservation::query()
            ->where('profil_professionnel_id', $profilId)
            ->whereHas('paiements', fn ($p) => $p
                ->whereHas('statut', fn ($s) => $s->where('value', 'EN_ATTENTE'))
                ->whereHas('mode', fn ($m) => $m->where('value', 'ESPECES')))
            ->with(['client.user'])
            ->get();
    }

    public function rapportsARediger(int $profilId): Collection
    {
        return $this->reservationsAuStatut($profilId, 'TERMINEE')
            ->whereDoesntHave('rapport')
            ->orderByDesc('date_prevue')
            ->get();
    }

    public function prochainesInterventions(int $profilId, int $jours = 7): Collection
    {
        return $this->reservationsAuStatut($profilId, 'CONFIRMEE')
            ->whereBetween('date_prevue', [today(), today()->addDays($jours)])
            ->orderBy('date_prevue')->orderBy('heure_prevue')
            ->get();
    }

    public function derniersAvis(int $profilId, int $limite = 3): Collection
    {
        return Avis::query()
            ->whereHas('reservation', fn ($r) => $r->where('profil_professionnel_id', $profilId))
            ->with('reservation.membre.user')
            ->latest('avis.created_at')
            ->limit($limite)
            ->get();
    }

   
    private function reservations(int $profilId): Builder
    {
        return DB::table('reservations as r')
            ->join('code_lists as s', 's.id', '=', 'r.statut_id')
            ->where('r.profil_professionnel_id', $profilId);
    }

    
    private function paiementsPayes(int $profilId): Builder
    {
        return DB::table('paiements as pa')
            ->join('reservations as r', 'r.id', '=', 'pa.reservation_id')
            ->join('code_lists as sp', 'sp.id', '=', 'pa.statut_id')
            ->where('r.profil_professionnel_id', $profilId)
            ->where('sp.value', 'PAYEE');
    }

    private function reservationsAuStatut(int $profilId, string $statut)
    {
        return Reservation::query()
            ->where('profil_professionnel_id', $profilId)
            ->whereHas('statut', fn ($s) => $s->where('value', $statut))
            ->with(['client.user', 'details.service']);
    }
}