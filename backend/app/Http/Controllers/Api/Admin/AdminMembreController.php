<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ListerMembresRequest;
use App\Http\Requests\Admin\SuspendreMembreRequest;
use App\Http\Resources\Admin\MembreAdminDetailResource;
use App\Http\Resources\Admin\MembreAdminResource;
use App\Services\AdminMembreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMembreController extends Controller
{
    public function __construct(private AdminMembreService $membres) {}

    /** GET /admin/membres?recherche=&role=CLIENT|PRESTATAIRE&statut=ACTIF|INACTIF|BLOQUE|SIGNALE */
    public function index(ListerMembresRequest $request)
    {
        return MembreAdminResource::collection($this->membres->lister($request->validated()));
    }

    /** GET /admin/membres/{id} : fiche + statistiques */
    public function show(int $id)
    {
        [$membre, $statistiques] = $this->membres->detail($id);

        return (new MembreAdminDetailResource($membre))
            ->additional(['statistiques' => $statistiques]);
    }

    /** PATCH /admin/membres/{id}/suspendre */
    public function suspendre(SuspendreMembreRequest $request, int $id): JsonResponse
    {
        [$membre, $annulees] = $this->membres->suspendre(
            $request->attributes->get('administrateur'),
            $id,
            $request->validated('motif'),
        );

        return response()->json([
            'message'               => 'Compte suspendu. ' . $annulees . ' réservation(s) à venir annulée(s).',
            'reservations_annulees' => $annulees,
            'data'                  => new MembreAdminDetailResource($membre),
        ]);
    }

    /** PATCH /admin/membres/{id}/reactiver */
    public function reactiver(Request $request, int $id): JsonResponse
    {
        $membre = $this->membres->reactiver($request->attributes->get('administrateur'), $id);

        return response()->json([
            'message' => 'Compte réactivé.',
            'data'    => new MembreAdminDetailResource($membre),
        ]);
    }
}