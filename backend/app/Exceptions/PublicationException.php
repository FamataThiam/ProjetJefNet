<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class PublicationException extends Exception
{
    public function __construct(string $message, private string $codeErreur, private int $statut = 422)
    {
        parent::__construct($message);
    }

    public static function pasPrestataire(): self
    {
        return new self('Seuls les prestataires peuvent publier des réalisations.', 'PAS_PRESTATAIRE', 403);
    }

    public static function tropDeMedias(int $max): self
    {
        return new self("Une publication peut contenir au maximum {$max} photos ou vidéos.", 'TROP_DE_MEDIAS');
    }

    public static function uneSeuleVideo(): self
    {
        return new self('Une publication ne peut contenir qu\'une seule vidéo.', 'UNE_SEULE_VIDEO');
    }

    public static function sansContenu(): self
    {
        return new self('Une publication doit contenir au moins une photo, une vidéo ou une description.', 'PUBLICATION_VIDE');
    }

    public static function reponseInvalide(): self
    {
        return new self('On ne peut répondre qu\'à un commentaire de cette publication, et pas à une réponse.', 'REPONSE_INVALIDE');
    }

    public static function pasAuteurCommentaire(): self
    {
        return new self('Vous ne pouvez supprimer que vos propres commentaires.', 'PAS_AUTEUR', 403);
    }

    public static function dejaMasquee(): self
    {
        return new self('Cette publication est déjà masquée.', 'DEJA_MASQUEE');
    }

    public static function dejaVisible(): self
    {
        return new self('Cette publication est déjà visible.', 'DEJA_VISIBLE');
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage(), 'code' => $this->codeErreur], $this->statut);
    }
}