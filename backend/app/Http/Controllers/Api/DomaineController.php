<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DomaineResource;
use App\Services\DomaineService;
use Illuminate\Http\JsonResponse;

class DomaineController extends Controller
{
    public function __construct(private DomaineService $domaines) {}

    // GET /api/domaines  (public)
    public function index(): JsonResponse
    {
        return response()->json([
            'domaines' => DomaineResource::collection($this->domaines->lister()),
        ]);
    }
}