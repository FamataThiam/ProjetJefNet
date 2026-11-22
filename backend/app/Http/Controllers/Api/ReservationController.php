<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reservation\MotifRequest;
use App\Http\Requests\Reservation\ReserverRequest;
use App\Http\Resources\ReservationResource;
use App\Services\PrestataireService;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    private const STATUTS = 'nullable|in:EN_ATTENTE,CONFIRMEE,EN_COURS,TERMINEE,ANNULEE,REFUSEE';

    public function __construct(
        private ReservationService $reservations,
        private PrestataireService $prestataires,
    ) {}

    

  
    public function index(Request $request)
    {
        $request->validate(['statut' => self::STATUTS]);

        $membre = $request->user()->membre;

        return ReservationResource::collection($this->reservations->mesReservations($membre, $request->query('statut')))
            ->additional(['compteurs' => $this->reservations->compteursClient($membre)]);
    }

    
    public function store(ReserverRequest $request): JsonResponse
    {
        $donnees = $request->validated();
        $donnees['profil_id'] ??= $this->prestataires->idDepuisUuid($donnees['prestataire_uuid']);

        $reservation = $this->reservations->reserver($request->user()->membre, $donnees);

        return response()->json([
            'message' => 'Réservation envoyée : le prestataire doit la confirmer.',
            'data'    => new ReservationResource($reservation),
        ], 201);
    }

    

    
    public function recues(Request $request)
    {
        $request->validate(['statut' => self::STATUTS]);

        $membre = $request->user()->membre;

        return ReservationResource::collection($this->reservations->reservationsRecues($membre, $request->query('statut')))
            ->additional(['compteurs' => $this->reservations->compteursRecues($membre)]);
    }

    
    public function confirmer(Request $request, string $uuid): JsonResponse
    {
        return $this->reponse('Réservation confirmée.',
            $this->reservations->confirmer($request->user()->membre, $uuid));
    }

    
    public function refuser(MotifRequest $request, string $uuid): JsonResponse
    {
        return $this->reponse('Réservation refusée.',
            $this->reservations->refuser($request->user()->membre, $uuid, $request->validated('raison')));
    }

    
    public function demarrer(Request $request, string $uuid): JsonResponse
    {
        return $this->reponse('Prestation démarrée.',
            $this->reservations->demarrer($request->user()->membre, $uuid));
    }

    
    public function terminer(Request $request, string $uuid): JsonResponse
    {
        return $this->reponse('Prestation terminée.',
            $this->reservations->terminer($request->user()->membre, $uuid));
    }

    

    
    public function show(Request $request, string $uuid): ReservationResource
    {
        return new ReservationResource(
            $this->reservations->consulter($request->user()->membre, $uuid)
        );
    }

    
    public function annuler(MotifRequest $request, string $uuid): JsonResponse
    {
        return $this->reponse('Réservation annulée.',
            $this->reservations->annuler($request->user()->membre, $uuid, $request->validated('raison')));
    }

    private function reponse(string $message, $reservation): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'data'    => new ReservationResource($reservation),
        ]);
    }
}