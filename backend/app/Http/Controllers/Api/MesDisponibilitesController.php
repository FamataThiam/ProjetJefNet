<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfilPro\AjouterDisponibiliteRequest;
use App\Http\Requests\ProfilPro\ModifierDisponibiliteRequest;
use App\Http\Resources\MaDisponibiliteResource;
use App\Services\AgendaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MesDisponibilitesController extends Controller
{
    public function __construct(private AgendaService $agenda) {}

    // GET /api/profil-pro/disponibilites
    public function index(Request $request): AnonymousResourceCollection
    {
        return MaDisponibiliteResource::collection($this->agenda->lister($request->user()->membre));
    }

    // POST /api/profil-pro/disponibilites
    public function store(AjouterDisponibiliteRequest $request): JsonResponse
    {
        $dispo = $this->agenda->ajouter($request->user()->membre, $request->validated());

        return (new MaDisponibiliteResource($dispo))->response()->setStatusCode(201);
    }

    // PATCH /api/profil-pro/disponibilites/{id}
    public function update(ModifierDisponibiliteRequest $request, int $id): MaDisponibiliteResource
    {
        return new MaDisponibiliteResource(
            $this->agenda->modifier($request->user()->membre, $id, $request->validated())
        );
    }

    // DELETE /api/profil-pro/disponibilites/{id}
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->agenda->supprimer($request->user()->membre, $id);

        return response()->json(['message' => 'Le créneau a été supprimé.']);
    }
}