<?php

namespace App\Http\Resources;

use App\Services\DemandesService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DemandeDisponibleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->uuid,
            'titre'       => $this->titre,
            'description' => $this->description,
            'ville'       => $this->ville,
            'localite'    => $this->localite,
            'domaine'     => [
                'id'      => $this->domaine->id,
                'libelle' => $this->domaine->libelle,
            ],
            'cree_le'     => $this->created_at?->toIso8601String(),
            'expire_le'   => $this->created_at?->copy()
                ->addDays(DemandesService::DUREE_VALIDITE_JOURS)->toIso8601String(),
        ];
    }
}