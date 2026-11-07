<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class PrestataireDetailResource extends PrestataireResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'biographie'         => $this->biographie,
            'experience'         => $this->experience,
            'linkedin'           => $this->linkedin,
            'portfolio'          => $this->portfolio,
            'rayon_intervention' => $this->rayonIntervention?->value,
            'services'           => ServiceResource::collection($this->whenLoaded('services')),
            'disponibilites'     => DisponibiliteResource::collection($this->whenLoaded('disponibilites')),
            'avis'               => AvisResource::collection($this->whenLoaded('avis')),
        ]);
    }
}