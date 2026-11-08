<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CodeListController;
use App\Http\Controllers\Api\DemandeController;
use App\Http\Controllers\Api\DemandesDisponiblesController;
use App\Http\Controllers\Api\DomaineController;
use App\Http\Controllers\Api\MembreController;
use App\Http\Controllers\Api\MesDisponibilitesController;
use App\Http\Controllers\Api\MesServicesController;
use App\Http\Controllers\Api\PrestataireController;
use App\Http\Controllers\Api\ProfilController;
use App\Http\Controllers\Api\ProfilProController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\SocialAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes publiques (accessibles sans compte)
|--------------------------------------------------------------------------
*/
Route::get('/ping', function () {
    return response()->json(['message' => 'JefNet API OK']);
});

Route::get('/code-lists/{type}',  [CodeListController::class, 'index']);
Route::get('/domaines',           [DomaineController::class, 'index']);
Route::get('/prestataires',       [PrestataireController::class, 'index']);
Route::get('/prestataires/{id}',  [PrestataireController::class, 'show'])
    ->whereNumber('id');

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
| Profil professionnel  →  /api/profil-pro/...  (connecté + profil complet)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'profil.complet'])->prefix('profil-pro')->group(function () {
    Route::get('/',               [ProfilProController::class, 'show']);
    Route::post('/',              [ProfilProController::class, 'store']);
    Route::patch('/',             [ProfilProController::class, 'update']);
    Route::delete('/',            [ProfilProController::class, 'destroy']);
    Route::post('/certification', [ProfilProController::class, 'demanderCertification']);

    // ---- Mes services ----
    Route::get('/services',         [MesServicesController::class, 'index']);
    Route::post('/services',        [MesServicesController::class, 'store']);
    Route::patch('/services/{id}',  [MesServicesController::class, 'update'])->whereNumber('id');
    Route::delete('/services/{id}', [MesServicesController::class, 'destroy'])->whereNumber('id');

    // ---- Mes disponibilités ----
    Route::get('/disponibilites',         [MesDisponibilitesController::class, 'index']);
    Route::post('/disponibilites',        [MesDisponibilitesController::class, 'store']);
    Route::patch('/disponibilites/{id}',  [MesDisponibilitesController::class, 'update'])->whereNumber('id');
    Route::delete('/disponibilites/{id}', [MesDisponibilitesController::class, 'destroy'])->whereNumber('id');

    // ---- Demandes disponibles (prestataire) ----
    Route::get('/demandes',        [DemandesDisponiblesController::class, 'index']);
    Route::get('/demandes/{uuid}', [DemandesDisponiblesController::class, 'show'])->whereUuid('uuid');
    Route::post('/demandes/{uuid}/accepter', [DemandesDisponiblesController::class, 'accepter'])->whereUuid('uuid');

    // ---- Réservations reçues (prestataire) ----
    Route::get('/reservations', [ReservationController::class, 'recues']);
});

/*
|--------------------------------------------------------------------------
| Demandes de service  →  /api/demandes/...  (connecté + profil complet)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'profil.complet'])->prefix('demandes')->group(function () {

    // ---- Mes demandes (client) ----
    Route::get('/',                 [DemandeController::class, 'index']);
    Route::post('/',                [DemandeController::class, 'store']);
    Route::get('/{uuid}',           [DemandeController::class, 'show'])->whereUuid('uuid');
    Route::patch('/{uuid}/annuler', [DemandeController::class, 'annuler'])->whereUuid('uuid');
});

/*
|--------------------------------------------------------------------------
| Réservations  →  /api/reservations/...  (connecté + profil complet)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'profil.complet'])->prefix('reservations')->group(function () {

    // ---- Client ----
    Route::get('/',  [ReservationController::class, 'index']);
    Route::post('/', [ReservationController::class, 'store']);

    // ---- Client ou prestataire concerné ----
    Route::get('/{uuid}',           [ReservationController::class, 'show'])->whereUuid('uuid');
    Route::patch('/{uuid}/annuler', [ReservationController::class, 'annuler'])->whereUuid('uuid')
        ->name('reservations.annuler');

    // ---- Prestataire ----
    Route::patch('/{uuid}/confirmer', [ReservationController::class, 'confirmer'])->whereUuid('uuid');
    Route::patch('/{uuid}/refuser',   [ReservationController::class, 'refuser'])->whereUuid('uuid');
    Route::patch('/{uuid}/demarrer',  [ReservationController::class, 'demarrer'])->whereUuid('uuid');
    Route::patch('/{uuid}/terminer',  [ReservationController::class, 'terminer'])->whereUuid('uuid');
});

/*
|--------------------------------------------------------------------------
| Membres  →  /api/membres/...  (connecté + profil complet)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'profil.complet'])->prefix('membres')->group(function () {
    Route::get('/{username}', [MembreController::class, 'show']);
});