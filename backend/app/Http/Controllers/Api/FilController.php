<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Publication\FilRequest;
use App\Http\Resources\Publication\PublicationResource;
use App\Services\FilService;
use App\Services\PublicationService;
use Illuminate\Http\Request;

class FilController extends Controller
{
    public function __construct(
        private FilService $fil,
        private PublicationService $publications,
    ) {}

    /** GET /fil?onglet=pour-vous|mes-prestataires|pres&lat=&lng=&rayon=&page= */
    public function index(FilRequest $request)
    {
        [$page, $cartes] = $this->fil->fil($request->user()->membre, $request->validated());

        return PublicationResource::collection($page)->additional([
            'onglet' => $request->validated('onglet') ?? 'pour-vous',
            'cartes' => $cartes,
        ]);
    }

    /** GET /fil/stories : publications de moins de 24 h avec photo ou vidéo */
    public function stories()
    {
        return PublicationResource::collection($this->fil->stories());
    }

    /** GET /publications/{id} */
    public function show(Request $request, int $id): PublicationResource
    {
        return new PublicationResource($this->publications->consulter($request->user()->membre, $id));
    }

    /** GET /prestataires/{id}/publications (public : visible sur le profil du prestataire) */
    public function duPrestataire(Request $request, int $id)
    {
       
        $lecteur = auth('sanctum')->user()?->membre;

        return PublicationResource::collection($this->publications->duPrestataire($lecteur, $id));
    }
}