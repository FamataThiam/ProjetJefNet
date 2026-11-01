<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\MembreService;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Api\MembreController;

class MembreController extends Controller
{
    public function __construct(private MembreService $membres) {}

    // GET /api/membres/{username}  (connecté + profil complet)
    public function show(string $username): JsonResponse
    {
        return response()->json([
            'membre' => new UserResource($this->membres->profilPublic($username)),
        ]);
    }
}