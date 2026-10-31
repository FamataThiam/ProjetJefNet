<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class CompteException extends Exception
{
    public function __construct(
        string $message,
        private string $codeErreur,
        private int $statut = 403,
    ) {
        parent::__construct($message);
    }

      
    public function report(): void
    {
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'code'    => $this->codeErreur,
        ], $this->statut);
    }


        public function codeErreur(): string
    {
        return $this->codeErreur;
    }
}