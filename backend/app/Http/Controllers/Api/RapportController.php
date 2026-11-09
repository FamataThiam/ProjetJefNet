<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Rapport\RapportRequest;
use App\Http\Resources\RapportResource;
use App\Services\RapportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Http\Requests\Rapport\SignerRapportRequest;

class RapportController extends Controller
{
    public function __construct(private RapportService $rapports) {}

    // GET /api/reservations/{uuid}/rapport  → consulter (client ou prestataire)
    public function show(Request $request, string $uuid): RapportResource
    {
        return new RapportResource($this->rapports->consulter($request->user()->membre, $uuid));
    }

    // POST /api/reservations/{uuid}/rapport  → rédiger (prestataire)
    public function store(RapportRequest $request, string $uuid): JsonResponse
    {
        $rapport = $this->rapports->rediger($request->user()->membre, $uuid, $request->validated());

        return response()->json([
            'message' => 'Rapport rédigé et signé. Le client a été invité à le signer.',
            'data'    => new RapportResource($rapport),
        ], 201);
    }

    // POST /api/reservations/{uuid}/rapport/modifier  → modifier (prestataire, avant la signature du client)
    public function update(RapportRequest $request, string $uuid): JsonResponse
    {
        $rapport = $this->rapports->modifier($request->user()->membre, $uuid, $request->validated());

        return response()->json([
            'message' => 'Rapport modifié. Le client a été prévenu.',
            'data'    => new RapportResource($rapport),
        ]);
    }

       // PATCH /api/reservations/{uuid}/rapport/signer  → signer (client)
    public function signer(SignerRapportRequest $request, string $uuid): JsonResponse
    {
        $rapport = $this->rapports->signer($request->user()->membre, $uuid, $request->validated('signature'));

        return response()->json([
            'message' => 'Rapport signé. Vous pouvez maintenant laisser un avis.',
            'data'    => new RapportResource($rapport),
        ]);
    }

    // GET /api/reservations/{uuid}/rapport/photos/{moment}  → afficher une photo (avant | apres)
    public function photo(Request $request, string $uuid, string $moment): StreamedResponse
    {
        return Storage::disk('local')->response(
            $this->rapports->photo($request->user()->membre, $uuid, $moment)
        );
    }

    // GET /api/reservations/{uuid}/rapport/pdf  → télécharger le PDF
    public function pdf(Request $request, string $uuid): Response
    {
        [$contenu, $nom] = $this->rapports->pdf($request->user()->membre, $uuid);

        return response($contenu, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$nom}\"",
        ]);
    }
}