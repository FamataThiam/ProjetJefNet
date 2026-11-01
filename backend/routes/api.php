<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CodeListController;
use App\Http\Controllers\Api\MembreController;
use App\Http\Controllers\Api\ProfilController;
use App\Http\Controllers\Api\SocialAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes publiques
|--------------------------------------------------------------------------
*/
Route::get('/ping', function () {
    return response()->json(['message' => 'JefNet API OK']);
});

Route::get('/code-lists/{type}', [CodeListController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Authentification  →  /api/auth/...
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {

    // ---- Publiques (pas besoin d'être connecté) ----
    Route::post('/inscription',                [AuthController::class, 'inscription']);
    Route::post('/verifier-email',             [AuthController::class, 'verifierEmail']);
    Route::post('/renvoyer-code',              [AuthController::class, 'renvoyerCode'])
        ->middleware('throttle:3,1');
    Route::post('/connexion',                  [AuthController::class, 'connexion'])
        ->middleware('throttle:5,1');
    Route::post('/mot-de-passe-oublie',        [AuthController::class, 'motDePasseOublie'])
        ->middleware('throttle:3,1');
    Route::post('/reinitialiser-mot-de-passe', [AuthController::class, 'reinitialiserMotDePasse'])
        ->middleware('throttle:5,1');

    // ---- Connexion via GitHub / Google / Facebook ----
    Route::get('/{provider}/redirect', [SocialAuthController::class, 'redirect'])
        ->whereIn('provider', ['github', 'google', 'facebook']);
    Route::get('/{provider}/callback', [SocialAuthController::class, 'callback'])
        ->whereIn('provider', ['github', 'google', 'facebook']);

    // ---- Protégées (jeton Sanctum obligatoire) ----
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/moi',          [AuthController::class, 'moi']);
        Route::post('/deconnexion', [AuthController::class, 'deconnexion']);
    });
});

/*
|--------------------------------------------------------------------------
| Profil  →  /api/profil/...  (connecté)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('profil')->group(function () {

    // ---- Accessibles SANS profil ----
    Route::post('/completer',   [ProfilController::class, 'completer']);
    Route::put('/mot-de-passe', [ProfilController::class, 'changerMotDePasse']);
    Route::delete('/',          [ProfilController::class, 'desactiver']);

    // ---- Réservées aux membres qui ont déjà un profil ----
    Route::middleware('profil.complet')->group(function () {
        Route::patch('/',         [ProfilController::class, 'modifier']);
        Route::post('/photo',     [ProfilController::class, 'changerPhoto']);
        Route::post('/signature', [ProfilController::class, 'changerSignature']);
    });
});

/*
|--------------------------------------------------------------------------
| Membres  →  /api/membres/...  (connecté + profil complet)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'profil.complet'])->prefix('membres')->group(function () {
    Route::get('/{username}', [MembreController::class, 'show']);
});