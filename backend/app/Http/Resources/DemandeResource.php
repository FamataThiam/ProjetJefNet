<?php

namespace App\Http\Resources;

use App\Services\DemandesService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DemandeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $statut = $this->statut?->value;

        return [
            'id'          => $this->uuid,         
            'titre'       => $this->titre,
            'description' => $this->description,
            'adresse'     => $this->adresse,
            'ville'       => $this->ville,
            'localite'    => $this->localite,
            'latitude'    => (float) $this->latitude,
            'longitude'   => (float) $this->longitude,
            'domaine'     => $this->whenLoaded('domaine', fn () => [
                'id'      => $this->domaine->id,
                'libelle' => $this->domaine->libelle,
            ]),
            'statut'      => $statut,
            'cree_le'     => $this->created_at?->toIso8601String(),
            'expire_le'   => $statut === 'EN_ATTENTE'
                ? $this->created_at?->copy()->addDays(DemandesService::DUREE_VALIDITE_JOURS)->toIso8601String()
                : null,
        ];
    }
}