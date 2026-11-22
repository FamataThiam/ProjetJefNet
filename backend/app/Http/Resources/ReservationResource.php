<?php

namespace App\Http\Resources;

use App\Http\Resources\Publication\PublicationResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $client = $this->client;
        $presta = $this->prestataire?->membre;
        $dernierPaiement = $this->relationLoaded('paiements') ? $this->paiements->sortByDesc('id')->first() : null;

        return [
            'id'                   => $this->uuid,
            'type'                 => $this->demande_service_id ? 'DEMANDE' : 'DIRECTE',
            'statut'               => $this->statut?->value,
            'date_prevue'          => $this->date_prevue?->format('Y-m-d'),
            'heure_prevue'         => substr((string) $this->heure_prevue, 0, 5),
            'adresse_intervention' => $this->adresse_intervention,
            'prix_final'           => (float) $this->prix_final,

            'mon_role'             => (int) $request->user()?->membre?->id === (int) $this->membre_id ? 'CLIENT' : 'PRESTATAIRE',
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
                'uuid'      => $client->user?->uuid,
                'nom'       => trim(($client->user?->prenom ?? '') . ' ' . ($client->user?->nom ?? '')),
                'telephone' => $client->telephone,
                'photo_url' => PublicationResource::url($client->photo_profil_path),
                'couleur'   => $client->couleur_perso,
            ]),

            'prestataire' => $this->whenLoaded('prestataire', fn () => [
                'id'        => $this->prestataire->id,
                'uuid'      => $this->prestataire->membre?->user?->uuid,
                'titre'     => $this->prestataire->titre_professionnel,
                'nom'       => trim(($this->prestataire->membre?->user?->prenom ?? '') . ' ' . ($this->prestataire->membre?->user?->nom ?? '')),
                'telephone' => $presta?->telephone,
                'photo_url' => PublicationResource::url($presta?->photo_profil_path),
                'couleur'   => $presta?->couleur_perso,
            ]),


            'rapport'  => $this->whenLoaded('rapport', fn () => $this->rapport ? ['statut' => $this->rapport->statut?->value] : null),
            'paiement' => $this->whenLoaded('paiements', fn () => $dernierPaiement ? [
                'statut' => $dernierPaiement->statut?->value,
                'mode'   => $dernierPaiement->mode?->value,
            ] : null),
            'avis'     => $this->whenLoaded('avis', fn () => $this->avis ? ['note' => (int) $this->avis->note] : null),

            'raison_annulation'    => $this->raison_annulation,
            'confirmee_le'         => $this->date_confirmation?->toIso8601String(),
            'annulee_le'           => $this->date_annulation?->toIso8601String(),
            'cree_le'              => $this->created_at?->toIso8601String(),
        ];
    }
}