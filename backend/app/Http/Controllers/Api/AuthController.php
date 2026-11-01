<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ConnexionRequest;
use App\Http\Requests\Auth\EmailRequest;
use App\Http\Requests\Auth\InscriptionRequest;
use App\Http\Requests\Auth\VerifierEmailRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\Auth\ReinitialiserMotDePasseRequest;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function __construct(private AuthService $auth) {}

    // POST /api/auth/inscription
    public function inscription(InscriptionRequest $request): JsonResponse
    {
        $user = $this->auth->inscrire($request->validated());

        return response()->json([
            'message' => 'Inscription réussie. Un code de vérification a été envoyé à votre adresse e-mail.',
            'user'    => new UserResource($user->load('statutCompte')),
        ], 201);
    }

       // POST /api/auth/verifier-email
    public function verifierEmail(VerifierEmailRequest $request): JsonResponse
    {
        $resultat = $this->auth->verifierEmail($request->email, $request->code);

        Auth::setUser($resultat['user']);

        return response()->json([
            'message' => 'Adresse e-mail vérifiée. Bienvenue sur JefNet !',
            'token'   => $resultat['token'],
            'user'    => new UserResource($resultat['user']->load('statutCompte', 'membre')),
        ]);
    }

    // POST /api/auth/renvoyer-code
    public function renvoyerCode(EmailRequest $request): JsonResponse
    {
        $this->auth->renvoyerCodeVerification($request->email);

        return response()->json([
            'message' => 'Si un compte non vérifié existe pour cette adresse, un nouveau code vient d\'être envoyé.',
        ]);
    }

       // POST /api/auth/connexion
    public function connexion(ConnexionRequest $request): JsonResponse
    {
        $resultat = $this->auth->connecter($request->email, $request->password);

        // L'utilisateur vient de s'identifier : la Resource doit le reconnaître comme propriétaire
         Auth::setUser($resultat['user']);

        return response()->json([
            'message' => 'Connexion réussie.',
            'token'   => $resultat['token'],
            'user'    => new UserResource($resultat['user']->load('statutCompte', 'membre')),
        ]);
    }

    // POST /api/auth/mot-de-passe-oublie
    public function motDePasseOublie(EmailRequest $request): JsonResponse
    {
        $this->auth->demanderReinitialisation($request->email);

        return response()->json([
            'message' => 'Si un compte existe pour cette adresse, un code de réinitialisation vient d\'être envoyé.',
        ]);
    }

    // GET /api/auth/moi  (protégée)
    public function moi(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()->load('statutCompte', 'membre')),
        ]);
    }

    // POST /api/auth/deconnexion  (protégée)
    public function deconnexion(Request $request): JsonResponse
    {
        $this->auth->deconnecter($request->user());

        return response()->json([
            'message' => 'Déconnexion réussie.',
        ]);
    }


        // POST /api/auth/reinitialiser-mot-de-passe
    public function reinitialiserMotDePasse(ReinitialiserMotDePasseRequest $request): JsonResponse
    {
        $this->auth->reinitialiserMotDePasse($request->email, $request->code, $request->password);

        return response()->json([
            'message' => 'Mot de passe modifié. Vous pouvez vous connecter avec votre nouveau mot de passe.',
        ]);
    }
}