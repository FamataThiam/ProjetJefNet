<?php

namespace App\Services;

use App\Exceptions\ProfilProException;
use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Repositories\Contracts\GeolocalisationRepositoryInterface;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use App\Support\Geo;
use Illuminate\Support\Facades\Storage;

class GeolocalisationService
{
    public const RAYON_PAR_DEFAUT_KM = 10;

    public function __construct(
        private GeolocalisationRepositoryInterface $geo,
        private ProfilProfessionnelRepositoryInterface $profils,
    ) {}

  
    public function enregistrerPosition(Membre $membre, float $lat, float $lng): ProfilProfessionnel
    {
        $profil = $this->profils->trouverParMembre($membre->id)
            ?? throw ProfilProException::pasPrestataire();

        return $this->profils->modifier($profil, [
            'latitude'        => $lat,
            'longitude'       => $lng,
            'position_maj_le' => now(),
        ]);
    }

  
    public function carte(float $lat, float $lng, ?float $rayonKm = null, ?int $domaineId = null): array
    {
        $rayonKm ??= self::RAYON_PAR_DEFAUT_KM;

        $prestataires = $this->geo->autourDe($lat, $lng, $rayonKm, $domaineId)
            ->map(fn (ProfilProfessionnel $p) => [
                'id'           => $p->id,
                'nom'          => $p->membre->user->prenom . ' ' . mb_substr($p->membre->user->nom, 0, 1) . '.',
                'titre'        => $p->titre_professionnel,
                'photo_url'    => $this->urlPhoto($p->membre->photo_profil_path),                
                'note_moyenne' => round((float) $p->note_moyenne, 1),
                'nombre_avis'  => (int) $p->nombre_avis,
                'certifie'     => $p->statutCertification?->value === 'CERTIFIE',
                'prix_min'     => $p->prix_min !== null ? (float) $p->prix_min : null,
                'distance_km'  => round((float) $p->distance_km, 1),
               
                'position'     => [
                    'lat' => Geo::approximer($p->latitude),
                    'lng' => Geo::approximer($p->longitude),
                ],
            ])
            ->values()
            ->all();

        return [
            'centre'       => ['lat' => $lat, 'lng' => $lng],
            'rayon_km'     => $rayonKm,
            'total'        => count($prestataires),
            'prestataires' => $prestataires,
        ];
    }



        
    private function urlPhoto(?string $chemin): ?string
    {
        if (! $chemin) {
            return null;
        }

        return str_starts_with($chemin, 'http') ? $chemin : Storage::disk('public')->url($chemin);
    }
}