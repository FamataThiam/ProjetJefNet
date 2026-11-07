<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrestataireResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titre_professionnel' => $this->titre_professionnel,
            'note_moyenne' => $this->nombre_avis > 0 ? (float) $this->note_moyenne : null,
            'nombre_avis' => $this->whenHas('nombre_avis', fn ($n) => (int) $n),
            'prix_min' => $this->whenHas('prix_min', fn ($p) => $p !== null ? (float) $p : null),
            'est_certifie'=> $this->statutCertification?->value === 'CERTIFIE',


            'prestataire' => new UserResource(
                $this->membre->user->setRelation('membre', $this->membre)
            ),

          
            'domaines' => $this->whenLoaded('services', fn () => $this->services
                ->pluck('domaine.libelle')
                ->unique()
                ->values()),
        ];
    }
}