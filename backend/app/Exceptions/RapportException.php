<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class RapportException extends Exception
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

    public static function prestationNonTerminee(string $statut): self
    {
        return new self("Le rapport ne peut être rédigé qu'une fois la prestation terminée (statut actuel : {$statut}).", 'PRESTATION_NON_TERMINEE', 409);
    }

    public static function dejaRedige(): self
    {
        return new self('Le rapport de cette prestation a déjà été rédigé. Vous pouvez le modifier tant que le client ne l\'a pas signé.', 'RAPPORT_EXISTANT', 409);
    }

    public static function introuvable(): self
    {
        return new self("Aucun rapport n'a encore été rédigé pour cette prestation.", 'RAPPORT_ABSENT', 404);
    }

    public static function dejaSigne(): self
    {
        return new self('Ce rapport a été signé par le client : il ne peut plus être modifié.', 'RAPPORT_SIGNE', 409);
    }

    public static function signatureManquante(): self
    {
        return new self('Ajoutez d\'abord votre signature électronique dans votre profil.', 'SIGNATURE_MANQUANTE', 422);
    }
}