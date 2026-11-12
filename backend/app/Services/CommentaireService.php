<?php

namespace App\Services;

use App\Exceptions\PublicationException;
use App\Models\CommentairePublication;
use App\Models\Membre;
use App\Repositories\Contracts\CommentaireRepositoryInterface;
use App\Repositories\Contracts\PublicationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CommentaireService
{
    public function __construct(
        private CommentaireRepositoryInterface $commentaires,
        private PublicationRepositoryInterface $publications,
        private NotificationService $notifications,
    ) {}

    public function lister(int $publicationId): LengthAwarePaginator
    {
        $this->publications->trouverVisible($publicationId);   // 404 si masquée ou inexistante

        return $this->commentaires->pourPublication($publicationId);
    }

    public function commenter(Membre $membre, int $publicationId, string $contenu, ?int $parentId): CommentairePublication
    {
        $publication = $this->publications->trouverVisible($publicationId);
        $parent      = null;

    
        if ($parentId) {
            $parent = CommentairePublication::find($parentId);

            if (! $parent || $parent->publication_id !== $publication->id || $parent->parent_id !== null) {
                throw PublicationException::reponseInvalide();
            }
        }

        $commentaire = $this->commentaires->creer([
            'publication_id' => $publication->id,
            'membre_id'      => $membre->id,
            'parent_id'      => $parent?->id,
            'contenu'        => trim($contenu),
        ]);

        $nom  = trim($membre->user->prenom . ' ' . mb_substr((string) $membre->user->nom, 0, 1) . '.');
        $lien = '/publications/' . $publication->id;

    
        $auteurPublication = $publication->prestataire->membre_id;
        if ($auteurPublication !== $membre->id) {
            $this->notifications->notifier(
                $auteurPublication,
                'PUBLICATION',
                'Nouveau commentaire',
                "{$nom} a commenté votre publication « {$publication->titre} ».",
                $lien,
            );
        }

   
        if ($parent && $parent->membre_id !== $membre->id && $parent->membre_id !== $auteurPublication) {
            $this->notifications->notifier(
                $parent->membre_id,
                'PUBLICATION',
                'Nouvelle réponse',
                "{$nom} a répondu à votre commentaire.",
                $lien,
            );
        }

        return $commentaire;
    }

  
    public function supprimer(Membre $membre, int $id): void
    {
        $commentaire = $this->commentaires->trouver($id);

        if ($commentaire->membre_id !== $membre->id) {
            throw PublicationException::pasAuteurCommentaire();
        }

        $this->commentaires->supprimer($commentaire);
    }

    
    public function supprimerParAdmin(int $id): void
    {
        $this->commentaires->supprimer($this->commentaires->trouver($id));
    }
}