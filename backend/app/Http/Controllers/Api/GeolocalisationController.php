<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Geo\CarteRequest;
use App\Http\Requests\Geo\PositionRequest;
use App\Services\GeolocalisationService;
use Illuminate\Http\JsonResponse;

class GeolocalisationController extends Controller
{
    public function __construct(private GeolocalisationService $geo) {}

    // PATCH /api/profil-pro/position  → le prestataire enregistre sa position
    public function position(PositionRequest $request): JsonResponse
    {
        $profil = $this->geo->enregistrerPosition(
            $request->user()->membre,
            (float) $request->validated('latitude'),
            (float) $request->validated('longitude'),
        );

        return response()->json([
            'message' => 'Votre position a été enregistrée. Vous apparaissez maintenant sur la carte.',
            'data'    => [
                'latitude'  => $profil->latitude,
                'longitude' => $profil->longitude,
                'maj_le'    => $profil->position_maj_le?->toIso8601String(),
            ],
        ]);
    }

    // GET /api/prestataires/carte?lat=…&lng=…&rayon=10&domaine=2  → prestataires autour de moi (public)
    public function carte(CarteRequest $request): JsonResponse
    {
        $donnees = $request->validated();

        return response()->json([
            'data' => $this->geo->carte(
                (float) $donnees['lat'],
                (float) $donnees['lng'],
                isset($donnees['rayon']) ? (float) $donnees['rayon'] : null,
                isset($donnees['domaine']) ? (int) $donnees['domaine'] : null,
            ),
        ]);
    }
}