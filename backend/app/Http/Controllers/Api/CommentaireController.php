<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Publication\CommentaireRequest;
use App\Http\Resources\Publication\CommentaireResource;
use App\Services\CommentaireService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentaireController extends Controller
{
    public function __construct(private CommentaireService $commentaires) {}

    /** GET /publications/{id}/commentaires */
    public function index(int $id)
    {
        return CommentaireResource::collection($this->commentaires->lister($id));
    }

    /** POST /publications/{id}/commentaires  (contenu, parent_id facultatif) */
    public function store(CommentaireRequest $request, int $id): JsonResponse
    {
        $commentaire = $this->commentaires->commenter(
            $request->user()->membre,
            $id,
            $request->validated('contenu'),
            $request->validated('parent_id'),
        );

        return response()->json([
            'message' => $commentaire->parent_id ? 'Réponse publiée.' : 'Commentaire publié.',
            'data'    => new CommentaireResource($commentaire),
        ], 201);
    }

    /** DELETE /commentaires/{id} : par son auteur */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->commentaires->supprimer($request->user()->membre, $id);

        return response()->json(['message' => 'Commentaire supprimé.']);
    }
}