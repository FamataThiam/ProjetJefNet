<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Demande\PublierDemandeRequest;
use App\Http\Resources\DemandeResource;
use App\Services\DemandesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DemandeController extends Controller
{
    public function __construct(private DemandesService $demandes) {}

    // GET /api/demandes  → lister mes demandes (filtre facultatif ?statut=...)
    public function index(Request $request)
    {
        $request->validate([
            'statut' => 'nullable|in:EN_ATTENTE,ACCEPTEE,REFUSEE,ANNULEE,EXPIREE,CONCLUE',
        ]);

        return DemandeResource::collection(
            $this->demandes->mesDemandes($request->user()->membre, $request->query('statut'))
        );
    }

    // POST /api/demandes  → publier une demande de service
    public function store(PublierDemandeRequest $request): JsonResponse
    {
        $demande = $this->demandes->publier($request->user()->membre, $request->validated());

        return (new DemandeResource($demande))->response()->setStatusCode(201);
    }

    // GET /api/demandes/{uuid}  → consulter une de mes demandes
    public function show(Request $request, string $uuid): DemandeResource
    {
        return new DemandeResource(
            $this->demandes->maDemande($request->user()->membre, $uuid)
        );
    }

    // PATCH /api/demandes/{uuid}/annuler  → annuler une demande en attente
    public function annuler(Request $request, string $uuid): JsonResponse
    {
        $demande = $this->demandes->annuler($request->user()->membre, $uuid);

        return response()->json([
            'message' => 'La demande a été annulée.',
            'data'    => new DemandeResource($demande),
        ]);
    }
}