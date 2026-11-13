<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class MessagerieException extends Exception
{
    public function __construct(string $message, private string $codeErreur, private int $statut = 422)
    {
        parent::__construct($message);
    }

    public static function soiMeme(): self
    {
        return new self('Vous ne pouvez pas démarrer une conversation avec vous-même.', 'CONVERSATION_SOI_MEME');
    }

    public static function interlocuteurIndisponible(): self
    {
        return new self("Ce membre n'est pas disponible pour échanger (compte suspendu ou fermé).", 'INTERLOCUTEUR_INDISPONIBLE');
    }

    public static function messageVide(): self
    {
        return new self('Le message est vide : écrivez un texte ou joignez un fichier.', 'MESSAGE_VIDE');
    }

    public static function reponseInvalide(): self
    {
        return new self("Le message auquel vous répondez n'appartient pas à cette conversation.", 'REPONSE_INVALIDE');
    }

    public static function appelIndisponible(): self
    {
        return new self("L'appel vidéo n'est pas disponible pour le moment. Réessayez plus tard.", 'APPEL_INDISPONIBLE', 503);
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage(), 'code' => $this->codeErreur], $this->statut);
    }


        public static function appelTermine(): self
    {
        return new self('Cet appel est terminé ou a expiré.', 'APPEL_TERMINE', 410);
    }
}