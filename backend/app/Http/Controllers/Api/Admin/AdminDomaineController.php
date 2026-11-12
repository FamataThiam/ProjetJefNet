<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DomaineRequest;
use App\Http\Resources\Admin\DomaineAdminResource;
use App\Services\AdminDomaineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminDomaineController extends Controller
{
    public function __construct(private AdminDomaineService $domaines) {}

    /** GET /admin/domaines?etat=ACTIF|INACTIF&recherche= */
    public function index(Request $request)
    {
        $request->validate([
            'etat'      => ['nullable', Rule::in(['ACTIF', 'INACTIF'])],
            'recherche' => ['nullable', 'string', 'max:100'],
        ]);

        return DomaineAdminResource::collection(
            $this->domaines->lister($request->query('etat'), $request->query('recherche'))
        );
    }

    /** GET /admin/domaines/{id} */
    public function show(int $id): DomaineAdminResource
    {
        return new DomaineAdminResource($this->domaines->consulter($id));
    }

    /** POST /admin/domaines  (form-data : libelle, description, image) */
    public function store(DomaineRequest $request): JsonResponse
    {
        $domaine = $this->domaines->creer($request->validated(), $request->file('image'));

        return response()->json([
            'message' => 'Domaine créé.',
            'data'    => new DomaineAdminResource($domaine),
        ], 201);
    }

    /** POST /admin/domaines/{id}/modifier  (form-data, car PATCH ne lit pas les fichiers) */
    public function update(DomaineRequest $request, int $id): JsonResponse
    {
        $domaine = $this->domaines->modifier(
            $id,
            $request->validated(),
            $request->file('image'),
            $request->boolean('supprimer_image'),
        );

        return response()->json([
            'message' => 'Domaine modifié.',
            'data'    => new DomaineAdminResource($domaine),
        ]);
    }

    /** PATCH /admin/domaines/{id}/activer */
    public function activer(int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Domaine activé : il est de nouveau proposé aux clients et aux prestataires.',
            'data'    => new DomaineAdminResource($this->domaines->activer($id)),
        ]);
    }

    /** PATCH /admin/domaines/{id}/desactiver */
    public function desactiver(int $id): JsonResponse
    {
        $domaine = $this->domaines->desactiver($id);

        return response()->json([
            'message' => "Domaine désactivé : il n'est plus proposé pour les nouveaux services et les nouvelles demandes. "
                . "Les {$domaine->services_actifs_count} service(s) actif(s) existant(s) sont conservés.",
            'data'    => new DomaineAdminResource($domaine),
        ]);
    }
}