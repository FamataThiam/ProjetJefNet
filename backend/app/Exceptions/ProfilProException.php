<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class ProfilProException extends Exception
{
    public function __construct(string $message, private string $codeErreur, private int $statut = 422)
    {
        parent::__construct($message);
    }

    public static function dejaPrestataire(): self
    {
        return new self('Vous avez déjà un profil professionnel.', 'DEJA_PRESTATAIRE', 409);
    }

    public function codeErreur(): string
    {
        return $this->codeErreur;
    }

   
    public function report(): void {}

    public function render($request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'code'    => $this->codeErreur,
        ], $this->statut);
    }


        public static function pasPrestataire(): self
    {
        return new self("Vous n'avez pas encore de profil professionnel.", 'PAS_PRESTATAIRE', 404);
    }


        public static function certificationEnCours(): self
    {
        return new self('Votre demande de certification est déjà en cours d\'examen.', 'CERTIFICATION_EN_COURS', 409);
    }

    // self : veut dire que la méthode est statique et qu'elle appartient à la classe elle-même, plutôt qu'à une instance spécifique de la classe. Cela signifie que vous pouvez appeler cette méthode sans avoir besoin de créer un objet de la classe ProfilProException.

    public static function dejaCertifie(): self
    {
        return new self('Votre profil est déjà certifié.', 'DEJA_CERTIFIE', 409);
    }

        public static function creneauChevauche(): self
    {
        return new self('Ce créneau chevauche un autre créneau du même jour.', 'CRENEAU_CHEVAUCHE', 409);
    }

    public static function creneauReserve(): self
    {
        return new self('Ce créneau est déjà réservé : il ne peut être ni modifié ni supprimé.', 'CRENEAU_RESERVE', 409);
    }
}