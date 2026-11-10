<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvisController;
use App\Http\Controllers\Api\CodeListController;
use App\Http\Controllers\Api\DemandeController;
use App\Http\Controllers\Api\DemandesDisponiblesController;
use App\Http\Controllers\Api\DomaineController;
use App\Http\Controllers\Api\MembreController;
use App\Http\Controllers\Api\MesDisponibilitesController;
use App\Http\Controllers\Api\MesServicesController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\PrestataireController;
use App\Http\Controllers\Api\ProfilController;
use App\Http\Controllers\Api\ProfilProController;
use App\Http\Controllers\Api\RapportController;
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
Route::get('/prestataires/{id}/avis', [AvisController::class, 'duPrestataire'])
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

    // ---- Paiement et facture ----
    Route::post('/{uuid}/paiement',            [PaiementController::class, 'payer'])->whereUuid('uuid');
    Route::get('/{uuid}/paiement',             [PaiementController::class, 'index'])->whereUuid('uuid');
    Route::patch('/{uuid}/paiement/confirmer', [PaiementController::class, 'confirmer'])->whereUuid('uuid');
    Route::get('/{uuid}/facture',              [PaiementController::class, 'facture'])->whereUuid('uuid');

    // ---- Rapport de prestation ----
    Route::get('/{uuid}/rapport',           [RapportController::class, 'show'])->whereUuid('uuid');
    Route::post('/{uuid}/rapport',          [RapportController::class, 'store'])->whereUuid('uuid')
        ->name('rapport.rediger');
    Route::post('/{uuid}/rapport/modifier', [RapportController::class, 'update'])->whereUuid('uuid');
    Route::patch('/{uuid}/rapport/signer',  [RapportController::class, 'signer'])->whereUuid('uuid');
    Route::get('/{uuid}/rapport/photos/{moment}', [RapportController::class, 'photo'])
        ->whereUuid('uuid')->whereIn('moment', ['avant', 'apres']);
    Route::get('/{uuid}/rapport/pdf',       [RapportController::class, 'pdf'])->whereUuid('uuid');

    // ---- Avis ----
    Route::get('/{uuid}/avis',   [AvisController::class, 'show'])->whereUuid('uuid');
    Route::post('/{uuid}/avis',  [AvisController::class, 'store'])->whereUuid('uuid')
        ->name('avis.laisser');
    Route::patch('/{uuid}/avis', [AvisController::class, 'update'])->whereUuid('uuid');
});

/*
|--------------------------------------------------------------------------
| Membres  →  /api/membres/...  (connecté + profil complet)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'profil.complet'])->prefix('membres')->group(function () {
    Route::get('/{username}', [MembreController::class, 'show']);
});