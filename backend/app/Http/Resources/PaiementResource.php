<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaiementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'montant'   => (float) $this->montant,
            'mode'      => $this->mode?->value,
            'statut'    => $this->statut?->value,
            'reference' => $this->reference_transaction,
            'paye_le'   => $this->date_paiement?->toIso8601String(),
            'cree_le'   => $this->created_at?->toIso8601String(),

            'facture' => $this->whenLoaded('facture', fn () => $this->facture ? [
                'numero'      => $this->facture->numero_facture,
                'emise_le'    => $this->facture->date_emission?->format('Y-m-d'),
                'montant'     => (float) $this->facture->montant,
                'telecharger' => url("/api/reservations/{$this->reservation->uuid}/facture"),
            ] : null),
        ];
    }
}