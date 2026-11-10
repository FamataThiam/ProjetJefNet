<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class AvisException extends Exception
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

    public static function rapportNonSigne(): self
    {
        return new self("Vous pourrez laisser un avis après avoir signé le rapport de prestation.", 'RAPPORT_NON_SIGNE', 409);
    }

    public static function dejaDonne(): self
    {
        return new self('Vous avez déjà laissé un avis pour cette prestation. Vous pouvez le modifier pendant 7 jours.', 'AVIS_EXISTANT', 409);
    }

    public static function introuvable(): self
    {
        return new self("Vous n'avez pas encore laissé d'avis pour cette prestation.", 'AVIS_ABSENT', 404);
    }

    public static function delaiDepasse(): self
    {
        return new self("Le délai de modification de 7 jours est dépassé : l'avis ne peut plus être modifié.", 'DELAI_DEPASSE', 409);
    }
}