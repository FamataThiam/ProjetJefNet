<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Demande\AccepterDemandeRequest;
use App\Http\Resources\DemandeDisponibleResource;
use App\Http\Resources\ReservationResource;
use App\Services\DemandesDisponiblesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DemandesDisponiblesController extends Controller
{
    public function __construct(private DemandesDisponiblesService $service) {}

    
    public function index(Request $request)
    {
        return DemandeDisponibleResource::collection(
            $this->service->lister($request->user()->membre)
        );
    }

    
    public function show(Request $request, string $uuid): DemandeDisponibleResource
    {
        return new DemandeDisponibleResource(
            $this->service->consulter($request->user()->membre, $uuid)
        );
    }


    public function accepter(AccepterDemandeRequest $request, string $uuid): JsonResponse
    {
        $reservation = $this->service->accepter($request->user()->membre, $uuid, $request->validated());

        return response()->json([
            'message' => 'Demande acceptée : la réservation est confirmée.',
            'data'    => new ReservationResource($reservation),
        ], 201);
    }
}