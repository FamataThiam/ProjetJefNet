<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profil\CompleterProfilRequest;
use App\Http\Resources\UserResource;
use App\Services\ProfilService;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\Profil\ModifierProfilRequest;
use App\Http\Requests\Profil\PhotoRequest;
use App\Http\Requests\Profil\SignatureRequest;
use App\Http\Requests\Profil\ChangerMotDePasseRequest;
use App\Http\Requests\Profil\DesactiverCompteRequest;

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




        // PATCH /api/profil  (pour modifier le profil d'un utilisateur déjà complété)
    public function modifier(ModifierProfilRequest $request): JsonResponse
    {
        $user = $this->profils->modifier($request->user(), $request->validated());

        return response()->json([
            'message' => 'Profil mis à jour.',
            'user'    => new UserResource($user),
        ]);
    }



        // POST /api/profil/photo  (protégée + profil complet)
    public function changerPhoto(PhotoRequest $request): JsonResponse
    {
        $user = $this->profils->changerPhoto($request->user(), $request->file('photo'));

        return response()->json([
            'message' => 'Photo de profil mise à jour.',
            'user'    => new UserResource($user),
        ]);
    }


        // POST /api/profil/signature  (protégée + profil complet)
    public function changerSignature(SignatureRequest $request): JsonResponse
    {
        $user = $this->profils->changerSignature($request->user(), $request->file('signature'));

        return response()->json([
            'message' => 'Signature enregistrée.',
            'user'    => new UserResource($user),
        ]);
    }



        // PUT /api/profil/mot-de-passe  (protégée)
    public function changerMotDePasse(ChangerMotDePasseRequest $request): JsonResponse
    {
        $this->profils->changerMotDePasse($request->user(), $request->password);

        return response()->json([
            'message' => 'Mot de passe modifié. Vos autres appareils ont été déconnectés.',
        ]);
    }



        // DELETE /api/profil  (protégée)
    public function desactiver(DesactiverCompteRequest $request): JsonResponse
    {
        $this->profils->desactiver($request->user());

        return response()->json([
            'message' => "Votre compte a été désactivé. Pour le réactiver, contactez l'administration JefNet.",
        ]);
    }
}