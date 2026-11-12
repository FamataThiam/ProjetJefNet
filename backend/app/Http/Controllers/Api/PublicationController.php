<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Publication\PublicationRequest;
use App\Http\Resources\Publication\PublicationResource;
use App\Services\PublicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicationController extends Controller
{
    public function __construct(private PublicationService $publications) {}

    /** GET /profil-pro/publications : mes publications (visibles et masquées) */
    public function index(Request $request)
    {
        return PublicationResource::collection($this->publications->mesPublications($request->user()->membre));
    }

    /** POST /profil-pro/publications  (form-data : titre, description, medias[]) */
    public function store(PublicationRequest $request): JsonResponse
    {
        $publication = $this->publications->publier(
            $request->user()->membre,
            $request->validated(),
            $request->file('medias', []),
        );

        return response()->json([
            'message' => 'Votre réalisation est publiée.',
            'data'    => new PublicationResource($publication),
        ], 201);
    }

    /** POST /profil-pro/publications/{id}/modifier  (form-data, car PATCH ne lit pas les fichiers) */
    public function update(PublicationRequest $request, int $id): JsonResponse
    {
        $publication = $this->publications->modifier(
            $request->user()->membre,
            $id,
            $request->validated(),
            $request->file('medias', []),
            array_map('intval', $request->input('medias_a_supprimer', [])),
        );

        return response()->json([
            'message' => 'Publication modifiée.',
            'data'    => new PublicationResource($publication),
        ]);
    }

    /** DELETE /profil-pro/publications/{id} */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->publications->supprimer($request->user()->membre, $id);

        return response()->json(['message' => 'Publication supprimée.']);
    }
}