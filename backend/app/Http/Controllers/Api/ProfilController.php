<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profil\CompleterProfilRequest;
use App\Http\Resources\UserResource;
use App\Services\ProfilService;
use Illuminate\Http\JsonResponse;

class ProfilController extends Controller
{
    public function __construct(private ProfilService $profils) {}

    // POST /api/profil/completer  (pour compléter le profil d'un utilisateur après l'inscription)
    public function completer(CompleterProfilRequest $request): JsonResponse
    {
        $user = $this->profils->completer(
            $request->user(),
            $request->safe()->except('photo'),
            $request->file('photo'),
        );

        return response()->json([
            'message' => 'Profil complété. Bienvenue sur JefNet !',
            'user'    => new UserResource($user),
        ], 201);
    }
}