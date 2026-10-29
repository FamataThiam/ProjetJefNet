<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CodeListResource;
use App\Services\CodeListService;

class CodeListController extends Controller
{
    public function __construct(
        private CodeListService $service
    ) {}

  // Renvoie les valeurs actives d'une liste, ex : valuesOf('ModePaiement')
    public function index(string $type)
    {
        $valeurs = $this->service->valuesOf($type);

        return CodeListResource::collection($valeurs);
    }
}