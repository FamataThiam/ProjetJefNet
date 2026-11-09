<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class PaiementException extends Exception
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

    public static function pasTerminee(string $statut): self
    {
        return new self("Seule une prestation terminée peut être payée (statut actuel : {$statut}).", 'PRESTATION_NON_TERMINEE', 409);
    }

    public static function dejaPayee(): self
    {
        return new self('Cette réservation est déjà payée.', 'DEJA_PAYEE', 409);
    }

    public static function especesEnAttente(): self
    {
        return new self('Un paiement en espèces attend déjà la confirmation du prestataire.', 'ESPECES_EN_ATTENTE', 409);
    }

    public static function aucunEspecesAConfirmer(): self
    {
        return new self("Aucun paiement en espèces n'attend de confirmation pour cette réservation.", 'RIEN_A_CONFIRMER', 409);
    }

    public static function pasDeFacture(): self
    {
        return new self("Aucune facture n'est encore disponible : le paiement n'est pas confirmé.", 'PAS_DE_FACTURE', 404);
    }
}