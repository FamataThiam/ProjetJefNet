<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    // GET /api/notifications  (?non_lues=1 pour n'afficher que les non lues)
    public function index(Request $request)
    {
        $request->validate(['non_lues' => 'nullable|boolean']);
        $membre = $request->user()->membre;

        return NotificationResource::collection(
            $this->notifications->lister($membre, $request->boolean('non_lues'))
        )->additional([
            'non_lues' => $this->notifications->nombreNonLues($membre),
        ]);
    }

    // GET /api/notifications/non-lues  → nombre pour le badge de la cloche
    public function nonLues(Request $request): JsonResponse
    {
        return response()->json([
            'non_lues' => $this->notifications->nombreNonLues($request->user()->membre),
        ]);
    }

    // PATCH /api/notifications/{id}/lue
    public function marquerLue(Request $request, int $id): JsonResponse
    {
        $membre       = $request->user()->membre;
        $notification = $this->notifications->marquerLue($membre, $id);

        return response()->json([
            'message'  => 'Notification marquée comme lue.',
            'data'     => new NotificationResource($notification),
            'non_lues' => $this->notifications->nombreNonLues($membre),
        ]);
    }

    // PATCH /api/notifications/tout-lire
    public function toutLire(Request $request): JsonResponse
    {
        $nombre = $this->notifications->toutMarquerLu($request->user()->membre);

        return response()->json([
            'message'  => "{$nombre} notification(s) marquée(s) comme lue(s).",
            'non_lues' => 0,
        ]);
    }
}