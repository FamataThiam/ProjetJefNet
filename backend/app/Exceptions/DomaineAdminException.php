<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class DomaineAdminException extends Exception
{
    public function __construct(string $message, private string $codeErreur, private int $statut = 422)
    {
        parent::__construct($message);
    }

    public static function dejaActif(): self
    {
        return new self('Ce domaine est déjà actif.', 'DOMAINE_DEJA_ACTIF');
    }

    public static function dejaInactif(): self
    {
        return new self('Ce domaine est déjà désactivé.', 'DOMAINE_DEJA_INACTIF');
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage(), 'code' => $this->codeErreur], $this->statut);
    }
}