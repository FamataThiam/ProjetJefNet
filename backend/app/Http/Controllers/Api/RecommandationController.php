<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Geo\RecommandationRequest;
use App\Services\RecommandationService;
use Illuminate\Http\JsonResponse;

class RecommandationController extends Controller
{
    public function __construct(private RecommandationService $recommandations) {}

    // GET /api/recommandations?lat=…&lng=…&domaine=…&limite=10
    public function index(RecommandationRequest $request): JsonResponse
    {
        $d = $request->validated();

        return response()->json([
            'data' => $this->recommandations->recommander(
                $request->user()->membre,
                isset($d['lat']) ? (float) $d['lat'] : null,
                isset($d['lng']) ? (float) $d['lng'] : null,
                isset($d['domaine']) ? (int) $d['domaine'] : null,
                (int) ($d['limite'] ?? 10),
            ),
        ]);
    }
}