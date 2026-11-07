<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfilPro\CreerProfilProRequest;
use App\Http\Requests\ProfilPro\ModifierProfilProRequest;
use App\Http\Resources\MonProfilProResource;
use App\Services\ProfilProService;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\ProfilPro\DemanderCertificationRequest;
use Illuminate\Http\Request;

class ProfilProController extends Controller
{
    public function __construct(private ProfilProService $profilPro) {}

    
    public function show(Request $request): MonProfilProResource
    {
        return new MonProfilProResource($this->profilPro->monProfil($request->user()->membre));
    }

   
    public function store(CreerProfilProRequest $request): JsonResponse
    {
        $profil = $this->profilPro->devenirPrestataire($request->user()->membre, $request->validated());

        return (new MonProfilProResource($profil))
            ->response()
            ->setStatusCode(201);
    }

    
    public function update(ModifierProfilProRequest $request): MonProfilProResource
    {
        return new MonProfilProResource(
            $this->profilPro->modifierProfil($request->user()->membre, $request->validated())
        );
    }



     public function demanderCertification(DemanderCertificationRequest $request): MonProfilProResource
    {
        return new MonProfilProResource(
            $this->profilPro->demanderCertification($request->user()->membre, $request->file('justificatif'))
        );
    }


    public function destroy(Request $request): JsonResponse
    {
        [$profil, $nombre] = $this->profilPro->desactiverProfil($request->user()->membre);

        return response()->json([
            'message'             => 'Votre profil professionnel a été désactivé. Vous n\'apparaissez plus dans la recherche.',
            'services_desactives' => $nombre,
            'data'                => new MonProfilProResource($profil),
        ]);
    }
}