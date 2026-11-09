<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RapportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $base = url("/api/reservations/{$this->reservation->uuid}/rapport");

        return [
            'numero'                 => $this->numero(),
            'statut'                 => $this->statut?->value,
            'description_prestation' => $this->description_prestation,
            'observations'           => $this->observations,

           
            'photo_avant'            => $this->photos_avant ? "{$base}/photos/avant" : null,
            'photo_apres'            => $this->photos_apres ? "{$base}/photos/apres" : null,

            'signe_prestataire_le'   => $this->date_signature_prestataire?->toIso8601String(),
            'signe_client_le'        => $this->date_signature_client?->toIso8601String(),
            'est_signe'              => $this->estSigneParLesDeux(),
            'pdf'                    => $this->estSigneParLesDeux() ? "{$base}/pdf" : null,

            'cree_le'                => $this->created_at?->toIso8601String(),
            'modifie_le'             => $this->updated_at?->toIso8601String(),
        ];
    }
}