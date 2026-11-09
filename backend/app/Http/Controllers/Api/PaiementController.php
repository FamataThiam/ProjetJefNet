<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Paiement\PayerRequest;
use App\Http\Resources\PaiementResource;
use App\Services\PaiementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaiementController extends Controller
{
    public function __construct(private PaiementService $paiements) {}

   
    public function payer(PayerRequest $request, string $uuid): JsonResponse
    {
        $paiement = $this->paiements->payer($request->user()->membre, $uuid, $request->validated());

        [$message, $code] = match ($paiement->statut->value) {
            'PAYEE'      => ['Paiement effectué. Votre facture est disponible.', 201],
            'EN_ATTENTE' => ['Paiement en espèces enregistré : le prestataire doit confirmer la réception.', 201],
            default      => ['Le paiement a échoué. Vérifiez votre solde ou réessayez.', 422],
        };

        return response()->json([
            'message' => $message,
            'data'    => new PaiementResource($paiement),
        ], $code);
    }

   
    public function confirmer(Request $request, string $uuid): JsonResponse
    {
        $paiement = $this->paiements->confirmerEspeces($request->user()->membre, $uuid);

        return response()->json([
            'message' => 'Réception des espèces confirmée. La facture a été générée.',
            'data'    => new PaiementResource($paiement),
        ]);
    }


    public function index(Request $request, string $uuid)
    {
        return PaiementResource::collection(
            $this->paiements->historique($request->user()->membre, $uuid)
        );
    }

    // GET /api/reservations/{uuid}/facture  → télécharger la facture PDF
    public function facture(Request $request, string $uuid): StreamedResponse
    {
        [$chemin, $nom] = $this->paiements->facture($request->user()->membre, $uuid);

        return Storage::disk('local')->download($chemin, $nom, ['Content-Type' => 'application/pdf']);
    }
}