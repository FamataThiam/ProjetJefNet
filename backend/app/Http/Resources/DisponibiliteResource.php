<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DisponibiliteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'jour'        => $this->jour_disponibilite->format('Y-m-d'),
            'heure_debut' => substr($this->heure_debut, 0, 5),   
            'heure_fin'   => substr($this->heure_fin, 0, 5),
        ];
    }
}