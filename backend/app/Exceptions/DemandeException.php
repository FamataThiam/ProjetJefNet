<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class DemandeException extends Exception
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

    public static function nonAnnulable(string $statut): self
    {
        return new self("Cette demande ne peut plus être annulée (statut : {$statut}).", 'DEMANDE_NON_ANNULABLE', 409);
    }

        public static function dejaPrise(): self
    {
        return new self('Cette demande a déjà été acceptée par un autre prestataire.', 'DEMANDE_DEJA_PRISE', 409);
    }

    public static function creneauOccupe(): self
    {
        return new self('Vous avez déjà une réservation à cette date et cette heure.', 'CRENEAU_OCCUPE', 409);
    }
}