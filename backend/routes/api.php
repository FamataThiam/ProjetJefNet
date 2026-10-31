<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CodeListController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\ProfilController;

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

    // Publiques (pas besoin d'être connecté)
    Route::post('/inscription',         [AuthController::class, 'inscription']);
    Route::post('/verifier-email',      [AuthController::class, 'verifierEmail']);
    Route::post('/renvoyer-code',       [AuthController::class, 'renvoyerCode'])
        ->middleware('throttle:3,1');
    Route::post('/connexion',           [AuthController::class, 'connexion'])
        ->middleware('throttle:5,1');
    Route::post('/mot-de-passe-oublie', [AuthController::class, 'motDePasseOublie'])
        ->middleware('throttle:3,1');

    Route::post('/reinitialiser-mot-de-passe', [AuthController::class, 'reinitialiserMotDePasse'])
        ->middleware('throttle:5,1');
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/moi',          [AuthController::class, 'moi']);
        Route::post('/deconnexion', [AuthController::class, 'deconnexion']);
    });


       
    Route::get('/{provider}/redirect', [SocialAuthController::class, 'redirect'])
        ->whereIn('provider', ['github', 'google', 'facebook']);
    Route::get('/{provider}/callback', [SocialAuthController::class, 'callback'])
        ->whereIn('provider', ['github', 'google', 'facebook']);
});


/*
|--------------------------------------------------------------------------
| Profil  →  /api/profil/...  (connecté)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('profil')->group(function () {
    Route::post('/completer', [ProfilController::class, 'completer']);
});



