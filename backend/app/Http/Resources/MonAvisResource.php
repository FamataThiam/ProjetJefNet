<?php

namespace App\Http\Resources;

use App\Services\AvisService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MonAvisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $limite = $this->created_at?->copy()->addDays(AvisService::DELAI_MODIFICATION_JOURS);

        return [
            'id'                  => $this->id,
            'note'                => $this->note,
            'commentaire'         => $this->commentaire,
            'reservation_id'      => $this->reservation?->uuid,
            'modifiable'          => $limite?->isFuture() ?? false,
            'modifiable_jusqu_au' => $limite?->toIso8601String(),
            'cree_le'             => $this->created_at?->toIso8601String(),
            'modifie_le'          => $this->updated_at?->toIso8601String(),
        ];
    }
}