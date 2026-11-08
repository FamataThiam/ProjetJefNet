<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class ReservationException extends Exception
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

    public static function propreService(): self
    {
        return new self('Vous ne pouvez pas réserver vos propres services.', 'PROPRE_SERVICE', 422);
    }

    public static function creneauIndisponible(): self
    {
        return new self("Le prestataire a déjà une réservation à ce créneau. Choisissez une autre heure.", 'CRENEAU_INDISPONIBLE', 409);
    }

        public static function actionImpossible(string $action, string $statut): self
    {
     
        $de = preg_match('/^[aeiouyéèh]/iu', $action) ? "d'" : 'de ';

        return new self("Impossible {$de}{$action} une réservation au statut {$statut}.", 'ACTION_IMPOSSIBLE', 409);
    }

    public static function tropTot(): self
    {
        return new self("La prestation ne peut pas démarrer avant la date prévue.", 'TROP_TOT', 409);
    }
}