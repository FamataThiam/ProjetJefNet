<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CertificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $this->membre?->user;

        return [
            'profil_id'              => $this->id,
            'prestataire'            => [
                'nom'       => trim(($user?->prenom ?? '') . ' ' . ($user?->nom ?? '')),
                'email'     => $user?->email,
                'telephone' => $this->membre?->telephone,
                'ville'     => $this->membre?->ville,
            ],
            'titre_professionnel'    => $this->titre_professionnel,
            'experience' => $this->experience,
            'nombre_services_actifs' => (int) ($this->nombre_services_actifs ?? 0),
            'statut' => $this->statutCertification?->value,
            'justificatif_envoye'    => $this->cv !== null,
            'demandee_le' => $this->certification_demandee_le?->toIso8601String(),

            
            'traitee_le'             => $this->certification_traitee_le?->toIso8601String(),
            'traitee_par'            => $this->traiteePar?->user
                ? trim($this->traiteePar->user->prenom . ' ' . $this->traiteePar->user->nom)
                : null,
            'motif_refus'            => $this->motif_refus,
        ];
    }
}