<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Prestataire\RechercherPrestatairesRequest;
use App\Http\Resources\PrestataireDetailResource;
use App\Http\Resources\PrestataireResource;
use App\Services\PrestataireService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PrestataireController extends Controller
{
    public function __construct(private PrestataireService $prestataires) {}

    // GET /api/prestataires
    public function index(RechercherPrestatairesRequest $request): AnonymousResourceCollection
    {
        return PrestataireResource::collection(
            $this->prestataires->rechercher($request->validated())
        );
    }

    // GET /api/prestataires/{id}
    public function show(int $id): PrestataireDetailResource
    {
        return new PrestataireDetailResource($this->prestataires->profilPublic($id));
    }
}