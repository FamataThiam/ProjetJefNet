<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MonProfilProResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'titre_professionnel'    => $this->titre_professionnel,
            'experience'             => $this->experience,
            'biographie'             => $this->biographie,
            'linkedin'               => $this->linkedin,
            'portfolio'              => $this->portfolio,
            'rayon_intervention'     => $this->rayonIntervention?->value,
            'statut_certification'   => $this->statutCertification?->value,
            'justificatif_envoye'    => $this->cv !== null,
            'note_moyenne'           => (float) $this->note_moyenne,
            'nombre_services_actifs' => $this->whenHas('nombre_services_actifs', fn ($n) => (int) $n),
            'cree_le'                => $this->created_at?->toIso8601String(),
        ];
    }
}