<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->uuid,
            'statut'               => $this->statut?->value,
            'date_prevue'          => $this->date_prevue?->format('Y-m-d'),
            'heure_prevue'         => substr((string) $this->heure_prevue, 0, 5),
            'adresse_intervention' => $this->adresse_intervention,
            'prix_final'           => (float) $this->prix_final,
            'demande_id'           => $this->whenLoaded('demande', fn () => $this->demande?->uuid),
            'services'             => $this->whenLoaded('details', fn () => $this->details->map(fn ($d) => [
                'id'   => $d->service_id,
                'nom'  => $d->service?->nom,
                'prix' => (float) $d->prix_service,
            ])),
            'confirmee_le'         => $this->date_confirmation?->toIso8601String(),
            'cree_le'              => $this->created_at?->toIso8601String(),
        ];
    }
}