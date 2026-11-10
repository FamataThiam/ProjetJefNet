<?php

namespace App\Services;

use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Repositories\Contracts\RecommandationRepositoryInterface;
use App\Support\Zone;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RecommandationService
{
    
    private const POIDS_PROXIMITE     = 30;
    private const POIDS_NOTE          = 30;
    private const POIDS_EXPERIENCE    = 15;
    private const POIDS_DISPONIBILITE = 15;
    private const POIDS_CERTIFICATION = 10;

  
    private const DISTANCE_PLEINE_KM = 2;    
    private const DISTANCE_MAX_KM    = 20;  
    private const AVIS_FICTIFS       = 3;   
    private const NOTE_NEUTRE        = 3.0;  
    private const PRESTATIONS_MAX    = 20; 

    public function __construct(private RecommandationRepositoryInterface $recommandations) {}

   
    public function recommander(Membre $client, ?float $lat, ?float $lng, ?int $domaineId, int $limite = 10): array
    {
        $modeGps   = $lat !== null && $lng !== null;
        $candidats = $this->recommandations->candidats($lat, $lng, $domaineId, $client->id);

        $resultats = $candidats
            ->map(fn (ProfilProfessionnel $p) => $this->evaluer($p, $client, $modeGps))
            ->sortByDesc('score')
            ->take($limite)
            ->values()
            ->all();

        return [
            'mode_proximite'  => $modeGps ? 'gps' : 'ville',
            'total_candidats' => $candidats->count(),
            'recommandations' => $resultats,
        ];
    }

   

    private function evaluer(ProfilProfessionnel $p, Membre $client, bool $modeGps): array
    {
        $raisons = [];

      
        [$proximite, $raisonProximite] = $this->scoreProximite($p, $client, $modeGps);
        if ($raisonProximite) {
            $raisons[] = $raisonProximite;
        }

       
        $nbAvis    = (int) $p->nombre_avis;
        $note      = (float) $p->note_moyenne;
        $bayes     = (self::AVIS_FICTIFS * self::NOTE_NEUTRE + $nbAvis * $note) / (self::AVIS_FICTIFS + $nbAvis);
        $scoreNote = max(0, min(1, ($bayes - 1) / 4)) * self::POIDS_NOTE;
        if ($nbAvis >= 1 && $note >= 4.5) {
            $raisons[] = 'Très bien noté (' . number_format($note, 1, ',', '') . "★, {$nbAvis} avis)";
        }

       
        $prestations     = (int) $p->prestations_terminees;
        $scoreExperience = min(1, log(1 + $prestations) / log(1 + self::PRESTATIONS_MAX)) * self::POIDS_EXPERIENCE;
        if ($prestations >= 10) {
            $raisons[] = "Expérimenté ({$prestations} prestations)";
        }

     
        $creneaux   = (int) $p->creneaux_7_jours;
        $scoreDispo = match (true) {
            $creneaux >= 3 => self::POIDS_DISPONIBILITE,
            $creneaux >= 1 => 10,
            default        => 0,
        };
        if ($creneaux >= 1) {
            $raisons[] = 'Disponible cette semaine';
        }

        
        $certifie    = $p->statutCertification?->value === 'CERTIFIE';
        $scoreCertif = $certifie ? self::POIDS_CERTIFICATION : 0;
        if ($certifie) {
            $raisons[] = 'Certifié JefNet';
        }

        $details = [
            'proximite'     => round($proximite, 1),
            'note'          => round($scoreNote, 1),
            'experience'    => round($scoreExperience, 1),
            'disponibilite' => $scoreDispo,
            'certification' => $scoreCertif,
        ];

        return [
            'id'           => $p->id,
            'nom'          => $p->membre->user->prenom . ' ' . mb_substr($p->membre->user->nom, 0, 1) . '.',
            'titre'        => $p->titre_professionnel,
            'photo_url'    => $this->urlPhoto($p->membre->photo_profil_path),
            'ville'        => $p->membre->ville,
            'note_moyenne' => round($note, 1),
            'nombre_avis'  => $nbAvis,
            'prix_min'     => $p->prix_min !== null ? (float) $p->prix_min : null,
            'distance_km'  => $p->distance_km !== null ? round((float) $p->distance_km, 1) : null,
            'certifie'     => $certifie,
            'score'        => (int) round(array_sum($details)),
            'details'      => $details,
            'raisons'      => $raisons,
        ];
    }

    /** @return array{0: float, 1: ?string} [points, raison] */
    private function scoreProximite(ProfilProfessionnel $p, Membre $client, bool $modeGps): array
    {
       
        if ($p->distance_km !== null) {
            $d = (float) $p->distance_km;

            $points = match (true) {
                $d <= self::DISTANCE_PLEINE_KM => self::POIDS_PROXIMITE,
                $d >= self::DISTANCE_MAX_KM    => 0,
                default => self::POIDS_PROXIMITE * (self::DISTANCE_MAX_KM - $d) / (self::DISTANCE_MAX_KM - self::DISTANCE_PLEINE_KM),
            };

            $raison = $d <= 5 ? 'Proche de vous (' . number_format($d, 1, ',', '') . ' km)' : null;

            return [$points, $raison];
        }

       
        if ($modeGps) {
            return [0, null];
        }

        
        $villeClient    = $this->normaliser($client->ville);
        $localiteClient = $this->normaliser($client->localite);
        $villePresta    = $this->normaliser($p->membre->ville);
        $localitePresta = $this->normaliser($p->membre->localite);

        if (! $villeClient || ! $villePresta) {
            return [0, null];
        }

        if ($villeClient === $villePresta && $localiteClient && $localiteClient === $localitePresta) {
            return [self::POIDS_PROXIMITE, "Dans votre quartier ({$p->membre->localite})"];
        }

        if ($villeClient === $villePresta) {
            return [20, "Dans votre ville ({$p->membre->ville})"];
        }

        $region = array_map(fn ($v) => $this->normaliser($v), Zone::villesDeLaRegionDe($client->ville));
        if (in_array($villePresta, $region, true)) {
            return [10, null];
        }

        return [0, null];
    }

   
    private function normaliser(?string $texte): ?string
    {
        return $texte ? Str::lower(Str::ascii(trim($texte))) : null;
    }

    private function urlPhoto(?string $chemin): ?string
    {
        if (! $chemin) {
            return null;
        }

        return str_starts_with($chemin, 'http') ? $chemin : Storage::disk('public')->url($chemin);
    }
}