<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->uuid,       
            'prenom'            => $this->prenom,
            'nom'               => $this->nom,
            'email'             => $this->email,
            'provider'          => $this->provider,      
            'est_email_verifie' => (bool) $this->est_email_verifie,

         
            'statut'            => new CodeListResource($this->whenLoaded('statutCompte')),
             'profil_complete'   => $this->when(
                $this->relationLoaded('membre'),
                fn () => $this->membre !== null
            ),

            'cree_le'           => $this->created_at?->toIso8601String(),
        ];
    }
}