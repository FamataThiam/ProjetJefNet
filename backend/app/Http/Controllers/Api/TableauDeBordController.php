<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TableauDeBordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TableauDeBordController extends Controller
{
    public function __construct(private TableauDeBordService $tableau) {}

    // GET /api/profil-pro/tableau-de-bord/resume  → les 8 cartes chiffres clés
    public function resume(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->tableau->resume($request->user()->membre)]);
    }

    // GET /api/profil-pro/tableau-de-bord/evolution?mois=12  → les courbes
    public function evolution(Request $request): JsonResponse
    {
        $request->validate(['mois' => 'nullable|integer|between:3,24']);

        return response()->json([
            'data' => $this->tableau->evolution($request->user()->membre, (int) $request->query('mois', 12)),
        ]);
    }

    // GET /api/profil-pro/tableau-de-bord/repartitions  → anneaux et camemberts
    public function repartitions(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->tableau->repartitions($request->user()->membre)]);
    }

    // GET /api/profil-pro/tableau-de-bord/activite  → barres par jour + carte de chaleur
    public function activite(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->tableau->activite($request->user()->membre)]);
    }

    // GET /api/profil-pro/tableau-de-bord/entonnoir
    public function entonnoir(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->tableau->entonnoir($request->user()->membre)]);
    }

    // GET /api/profil-pro/tableau-de-bord/a-faire  → actions en attente + agenda
    public function aFaire(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->tableau->aFaire($request->user()->membre)]);
    }
}