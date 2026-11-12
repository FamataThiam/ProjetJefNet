<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class MembreAdminException extends Exception
{
    public function __construct(
        string $message,
        private string $codeErreur,
        private int $statut = 422,
    ) {
        parent::__construct($message);
    }

    public static function compteAdministrateur(): self
    {
        return new self("Ce compte appartient à un administrateur : il ne peut pas être suspendu ici.", 'COMPTE_ADMINISTRATEUR', 403);
    }

    public static function soiMeme(): self
    {
        return new self('Vous ne pouvez pas suspendre votre propre compte.', 'SUSPENSION_SOI_MEME', 403);
    }

    public static function dejaBloque(): self
    {
        return new self('Ce compte est déjà suspendu.', 'DEJA_BLOQUE');
    }

    public static function pasBloque(): self
    {
        return new self("Ce compte n'est pas suspendu : il n'y a rien à réactiver.", 'PAS_BLOQUE');
    }

    public static function compteFerme(): self
    {
        return new self('Ce compte a été fermé par son propriétaire : il ne peut pas être modifié par l\'administration.', 'COMPTE_FERME');
    }

    public function codeErreur(): string
    {
        return $this->codeErreur;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'code'    => $this->codeErreur,
        ], $this->statut);
    }
}