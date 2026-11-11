<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminTableauDeBordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTableauDeBordController extends Controller
{
    public function __construct(private AdminTableauDeBordService $tableau) {}

    // GET /api/admin/tableau-de-bord/resume  → les 8 cartes
    public function resume(): JsonResponse
    {
        return response()->json(['data' => $this->tableau->resume()]);
    }

    // GET /api/admin/tableau-de-bord/evolution?mois=12  → les courbes
    public function evolution(Request $request): JsonResponse
    {
        $request->validate(['mois' => 'nullable|integer|between:3,24']);

        return response()->json(['data' => $this->tableau->evolution((int) $request->query('mois', 12))]);
    }

    // GET /api/admin/tableau-de-bord/repartitions  → anneaux, barres, classement, activité
    public function repartitions(): JsonResponse
    {
        return response()->json(['data' => $this->tableau->repartitions()]);
    }

    // GET /api/admin/tableau-de-bord/marche  → entonnoir des demandes, besoins non couverts, carte
    public function marche(): JsonResponse
    {
        return response()->json(['data' => $this->tableau->marche()]);
    }

    // GET /api/admin/tableau-de-bord/a-traiter  → listes d'actions
    public function aTraiter(): JsonResponse
    {
        return response()->json(['data' => $this->tableau->aTraiter()]);
    }
}