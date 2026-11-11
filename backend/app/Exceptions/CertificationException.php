<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class CertificationException extends Exception
{
    public function __construct(string $message, private string $codeErreur, private int $statut = 422)
    {
        parent::__construct($message);
    }

    public function report(): void {}

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage(), 'code' => $this->codeErreur], $this->statut);
    }

    public static function pasEnAttente(string $statut): self
    {
        return new self("Cette demande a déjà été traitée (statut actuel : {$statut}).", 'DEMANDE_DEJA_TRAITEE', 409);
    }

    public static function sansJustificatif(): self
    {
        return new self("Ce prestataire n'a envoyé aucun justificatif.", 'JUSTIFICATIF_ABSENT', 404);
    }
}