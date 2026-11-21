<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Les informations privées ne sont envoyées qu'à l'utilisateur lui-même
        $estProprietaire = $request->user()?->id === $this->id;

        return [
            'id'      => $this->uuid,
            'prenom'  => $this->prenom,
            'nom'     => $this->nom,
            'membre'  => new MembreResource($this->whenLoaded('membre')),
            'cree_le' => $this->created_at?->toIso8601String(),

            'email'              => $this->when($estProprietaire, $this->email),
            'provider'           => $this->when($estProprietaire, $this->provider),
            'est_email_verifie'  => $this->when($estProprietaire, (bool) $this->est_email_verifie),
            'statut'             => $this->when($estProprietaire, fn () => new CodeListResource($this->whenLoaded('statutCompte'))),
            'profil_complete'    => $this->when(
                $estProprietaire && $this->relationLoaded('membre'),
                fn () => $this->membre !== null
            ),
            // vrai si le membre a un profil professionnel (prestataire)
            'est_prestataire'    => $this->when(
                $estProprietaire,
                fn () => $this->membre?->profilProfessionnel()->exists() ?? false
            ),
            'est_administrateur' => $this->when($estProprietaire, fn () => $this->estAdministrateur()),
            'canal' => $this->when($estProprietaire && $this->relationLoaded('membre'), fn () => $this->membre ? 'membre.' . $this->membre->id : null),
            'a_mot_de_passe'     => $this->when($estProprietaire, fn () => $this->password !== null),
            'niveau_acces'       => $this->when($estProprietaire, fn () => $this->administrateur?->niveauAcces?->value),
        ];
    }
}