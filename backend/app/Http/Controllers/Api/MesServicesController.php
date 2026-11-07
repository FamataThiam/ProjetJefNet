<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfilPro\AjouterServiceRequest;
use App\Http\Requests\ProfilPro\ModifierServiceRequest;
use App\Http\Resources\MonServiceResource;
use App\Services\CatalogueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MesServicesController extends Controller
{
    public function __construct(private CatalogueService $catalogue) {}

    // GET /api/profil-pro/services
    public function index(Request $request): AnonymousResourceCollection
    {
        return MonServiceResource::collection($this->catalogue->lister($request->user()->membre));
    }

    // POST /api/profil-pro/services
    public function store(AjouterServiceRequest $request): JsonResponse
    {
        $service = $this->catalogue->ajouter($request->user()->membre, $request->validated());

        return (new MonServiceResource($service))->response()->setStatusCode(201);
    }

    // PATCH /api/profil-pro/services/{id}
    public function update(ModifierServiceRequest $request, int $id): MonServiceResource
    {
        return new MonServiceResource(
            $this->catalogue->modifier($request->user()->membre, $id, $request->validated())
        );
    }

    // DELETE /api/profil-pro/services/{id}  → désactivation (pas de suppression)
    public function destroy(Request $request, int $id): JsonResponse
    {
        $service = $this->catalogue->desactiver($request->user()->membre, $id);

        return response()->json([
            'message' => 'Le service a été désactivé.',
            'data'    => new MonServiceResource($service),
        ]);
    }
}