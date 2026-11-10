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
            'type'                 => $this->demande_service_id ? 'DEMANDE' : 'DIRECTE',
            'statut'               => $this->statut?->value,
            'date_prevue'          => $this->date_prevue?->format('Y-m-d'),
            'heure_prevue'         => substr((string) $this->heure_prevue, 0, 5),
            'adresse_intervention' => $this->adresse_intervention,
            'prix_final'           => (float) $this->prix_final,
            'demande_id'           => $this->whenLoaded('demande', fn () => $this->demande?->uuid),
                       
            'position'             => $this->whenLoaded('demande', fn () => $this->demande ? [
                'lat' => (float) $this->demande->latitude,
                'lng' => (float) $this->demande->longitude,
            ] : null),

            'services' => $this->whenLoaded('details', fn () => $this->details->map(fn ($d) => [
                'id'   => $d->service_id,
                'nom'  => $d->service?->nom,
                'prix' => (float) $d->prix_service,
            ])),

            'client' => $this->whenLoaded('client', fn () => [
                'nom'       => trim(($this->client->user?->prenom ?? '') . ' ' . ($this->client->user?->nom ?? '')),
                'telephone' => $this->client->telephone,
            ]),

            'prestataire' => $this->whenLoaded('prestataire', fn () => [
                'id'        => $this->prestataire->id,
                'titre'     => $this->prestataire->titre_professionnel,
                'nom'       => trim(($this->prestataire->membre?->user?->prenom ?? '') . ' ' . ($this->prestataire->membre?->user?->nom ?? '')),
                'telephone' => $this->prestataire->membre?->telephone,
            ]),

            'raison_annulation'    => $this->raison_annulation,
            'confirmee_le'         => $this->date_confirmation?->toIso8601String(),
            'annulee_le'           => $this->date_annulation?->toIso8601String(),
            'cree_le'              => $this->created_at?->toIso8601String(),
        ];
    }
}