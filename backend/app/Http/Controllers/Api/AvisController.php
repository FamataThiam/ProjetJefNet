<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Avis\AvisRequest;
use App\Http\Resources\AvisResource;
use App\Http\Resources\MonAvisResource;
use App\Services\AvisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AvisController extends Controller
{
    public function __construct(private AvisService $avis) {}

    // POST /api/reservations/{uuid}/avis  → laisser un avis (client)
    public function store(AvisRequest $request, string $uuid): JsonResponse
    {
        $avis = $this->avis->laisser($request->user()->membre, $uuid, $request->validated());

        return response()->json([
            'message' => 'Merci pour votre avis !',
            'data'    => new MonAvisResource($avis),
        ], 201);
    }

    // PATCH /api/reservations/{uuid}/avis  → modifier son avis (7 jours)
    public function update(AvisRequest $request, string $uuid): JsonResponse
    {
        $avis = $this->avis->modifier($request->user()->membre, $uuid, $request->validated());

        return response()->json([
            'message' => 'Votre avis a été modifié.',
            'data'    => new MonAvisResource($avis),
        ]);
    }

    // GET /api/reservations/{uuid}/avis  → consulter son avis
    public function show(Request $request, string $uuid): MonAvisResource
    {
        return new MonAvisResource($this->avis->monAvis($request->user()->membre, $uuid));
    }

    // GET /api/prestataires/{id}/avis  → avis d'un prestataire + statistiques (public)
    public function duPrestataire(int $id)
    {
        ['avis' => $avis, 'statistiques' => $statistiques] = $this->avis->duPrestataire($id);

        return AvisResource::collection($avis)->additional(['statistiques' => $statistiques]);
    }
}