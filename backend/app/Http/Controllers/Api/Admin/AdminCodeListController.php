<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CodeListRequest;
use App\Http\Resources\Admin\CodeListAdminResource;
use App\Models\CodeList;
use App\Services\AdminCodeListService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminCodeListController extends Controller
{
    public function __construct(private AdminCodeListService $listes) {}

    /** GET /admin/code-lists?type=ModePaiement&etat=ACTIF|INACTIF */
    public function index(Request $request)
    {
        $request->validate([
            'type' => ['nullable', 'string', Rule::in(CodeList::types())],
            'etat' => ['nullable', Rule::in(['ACTIF', 'INACTIF'])],
        ]);

        return CodeListAdminResource::collection(
            $this->listes->lister($request->query('type'), $request->query('etat'))
        );
    }

    /** GET /admin/code-lists/types : les listes et leur nombre de valeurs */
    public function types(): JsonResponse
    {
        return response()->json(['data' => $this->listes->types()]);
    }

    /** POST /admin/code-lists  (type, valeur, description) */
    public function store(CodeListRequest $request): JsonResponse
    {
        $donnees = $request->validated();
        $code = $this->listes->ajouter($donnees['type'], $donnees['valeur'], $donnees['description'] ?? null);

        return response()->json([
            'message' => "Valeur {$code->value} ajoutée à la liste {$code->type}.",
            'data'    => new CodeListAdminResource($code),
        ], 201);
    }

    /** PATCH /admin/code-lists/{id}/activer */
    public function activer(int $id): JsonResponse
    {
        $code = $this->listes->activer($id);

        return response()->json([
            'message' => "Valeur {$code->value} activée : elle est de nouveau proposée.",
            'data'    => new CodeListAdminResource($code),
        ]);
    }

    /** PATCH /admin/code-lists/{id}/desactiver */
    public function desactiver(int $id): JsonResponse
    {
        $code = $this->listes->desactiver($id);

        return response()->json([
            'message' => "Valeur {$code->value} désactivée : elle n'est plus proposée, mais les données qui l'utilisent sont conservées.",
            'data'    => new CodeListAdminResource($code),
        ]);
    }
}