<?php

namespace App\Repositories\Eloquent;

use App\Models\CommentairePublication;
use App\Repositories\Contracts\CommentaireRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CommentaireRepository implements CommentaireRepositoryInterface
{
    private const RELATIONS = ['auteur.user', 'reponses.auteur.user'];

    public function pourPublication(int $publicationId, int $parPage = 10): LengthAwarePaginator
    {
        return CommentairePublication::query()
            ->where('publication_id', $publicationId)
            ->whereNull('parent_id')
            ->with(self::RELATIONS)
            ->latest()
            ->orderByDesc('id')
            ->paginate($parPage)
            ->withQueryString();
    }

    public function trouver(int $id): CommentairePublication
    {
        return CommentairePublication::with(['publication', ...self::RELATIONS])->findOrFail($id);
    }

    public function creer(array $donnees): CommentairePublication
    {
        return CommentairePublication::create($donnees)->load(self::RELATIONS);
    }

    public function supprimer(CommentairePublication $commentaire): void
    {
        $commentaire->reponses()->delete();
        $commentaire->delete();
    }
}