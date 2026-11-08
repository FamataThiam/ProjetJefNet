<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reservation\MotifRequest;
use App\Http\Requests\Reservation\ReserverRequest;
use App\Http\Resources\ReservationResource;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    private const STATUTS = 'nullable|in:EN_ATTENTE,CONFIRMEE,EN_COURS,TERMINEE,ANNULEE,REFUSEE';

    public function __construct(private ReservationService $reservations) {}

    

  
    public function index(Request $request)
    {
        $request->validate(['statut' => self::STATUTS]);

        return ReservationResource::collection(
            $this->reservations->mesReservations($request->user()->membre, $request->query('statut'))
        );
    }

    
    public function store(ReserverRequest $request): JsonResponse
    {
        $reservation = $this->reservations->reserver($request->user()->membre, $request->validated());

        return response()->json([
            'message' => 'Réservation envoyée : le prestataire doit la confirmer.',
            'data'    => new ReservationResource($reservation),
        ], 201);
    }

    

    
    public function recues(Request $request)
    {
        $request->validate(['statut' => self::STATUTS]);

        return ReservationResource::collection(
            $this->reservations->reservationsRecues($request->user()->membre, $request->query('statut'))
        );
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