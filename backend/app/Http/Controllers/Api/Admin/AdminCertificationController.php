<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RefuserCertificationRequest;
use App\Http\Resources\Admin\CertificationResource;
use App\Services\AdminCertificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Storage;

class AdminCertificationController extends Controller
{
    public function __construct(private AdminCertificationService $certifications) {}

    /** GET /admin/certifications?statut=EN_ATTENTE|CERTIFIE|REFUSE|NON_CERTIFIE|TOUS */
    public function index(Request $request)
    {
        $request->validate([
            'statut' => ['nullable', Rule::in(['EN_ATTENTE', 'CERTIFIE', 'REFUSE', 'NON_CERTIFIE', 'TOUS'])],
        ]);

        return CertificationResource::collection(
            $this->certifications->lister($request->query('statut', 'EN_ATTENTE'))
        );
    }

    /** GET /admin/certifications/{id} */
    public function show(int $id): CertificationResource
    {
        return new CertificationResource($this->certifications->consulter($id));
    }

    /** GET /admin/certifications/{id}/justificatif : renvoie le lien signé (10 min) */
    public function justificatif(int $id): JsonResponse
    {
        return response()->json(['data' => $this->certifications->lienJustificatif($id)]);
    }

    /** GET /admin/certifications/{id}/fichier?signature=... : route signée, ouvre le fichier */
    public function fichier(int $id): StreamedResponse
    {
        $chemin = $this->certifications->cheminJustificatif($id);

        return Storage::disk('local')->response($chemin);
    }

    /** PATCH /admin/certifications/{id}/valider */
    public function valider(Request $request, int $id): JsonResponse
    {
        $profil = $this->certifications->valider($request->attributes->get('administrateur'), $id);

        return response()->json([
            'message' => 'Le profil est maintenant certifié.',
            'data'    => new CertificationResource($profil),
        ]);
    }

    /** PATCH /admin/certifications/{id}/refuser */
    public function refuser(RefuserCertificationRequest $request, int $id): JsonResponse
    {
        $profil = $this->certifications->refuser(
            $request->attributes->get('administrateur'),
            $id,
            $request->validated('motif'),
        );

        return response()->json([
            'message' => 'La demande de certification a été refusée.',
            'data'    => new CertificationResource($profil),
        ]);
    }
}