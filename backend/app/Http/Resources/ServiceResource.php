<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'nom'         => $this->nom,
            'description' => $this->description,
            'prix'        => (float) $this->prix,
            'unite_tarif' => $this->unite_tarif,
            'duree'       => $this->duree,
            'domaine'     => $this->whenLoaded('domaine', fn () => [
                'id'      => $this->domaine->id,
                'libelle' => $this->domaine->libelle,
            ]),
        ];
    }
}