<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        
        $estProprietaire = $request->user()?->id === $this->id;

        return [
           
            'id'      => $this->uuid,
            'prenom'  => $this->prenom,
            'nom'     => $this->nom,
            'membre'  => new MembreResource($this->whenLoaded('membre')),
            'cree_le' => $this->created_at?->toIso8601String(),

         
            'email'             => $this->when($estProprietaire, $this->email),
            'provider'          => $this->when($estProprietaire, $this->provider),
            'est_email_verifie' => $this->when($estProprietaire, (bool) $this->est_email_verifie),
            'statut'            => $this->when($estProprietaire, fn () => new CodeListResource($this->whenLoaded('statutCompte'))),
            'profil_complete'   => $this->when(
                $estProprietaire && $this->relationLoaded('membre'),
                fn () => $this->membre !== null
            ),
        ];
    }
}