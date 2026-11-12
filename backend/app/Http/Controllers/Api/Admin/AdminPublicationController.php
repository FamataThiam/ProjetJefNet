<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Publication\PublicationResource;
use App\Services\CommentaireService;
use App\Services\PublicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminPublicationController extends Controller
{
    public function __construct(
        private PublicationService $publications,
        private CommentaireService $commentaires,
    ) {}

    /** GET /admin/publications?etat=VISIBLE|MASQUEE */
    public function index(Request $request)
    {
        $request->validate(['etat' => ['nullable', Rule::in(['VISIBLE', 'MASQUEE'])]]);

        return PublicationResource::collection($this->publications->listerAdmin($request->query('etat')));
    }

    /** PATCH /admin/publications/{id}/masquer  (motif obligatoire) */
    public function masquer(Request $request, int $id): JsonResponse
    {
        $request->validate(
            ['motif' => ['required', 'string', 'min:10', 'max:500']],
            ['motif.required' => 'Le motif est obligatoire.', 'motif.min' => 'Le motif doit contenir au moins 10 caractères.'],
        );

        return response()->json([
            'message' => 'Publication masquée. Le prestataire a été prévenu.',
            'data'    => new PublicationResource($this->publications->masquer($id, $request->input('motif'))),
        ]);
    }

    /** PATCH /admin/publications/{id}/reafficher */
    public function reafficher(int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Publication de nouveau visible.',
            'data'    => new PublicationResource($this->publications->reafficher($id)),
        ]);
    }

    /** DELETE /admin/commentaires/{id} */
    public function supprimerCommentaire(int $id): JsonResponse
    {
        $this->commentaires->supprimerParAdmin($id);

        return response()->json(['message' => 'Commentaire supprimé par la modération.']);
    }
}