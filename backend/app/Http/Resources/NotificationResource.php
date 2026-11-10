<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'      => $this->id,
            'type'    => $this->type?->value,
            'titre'   => $this->titre,
            'contenu' => $this->contenu,
            'lien'    => $this->lien,
            'est_lu'  => $this->est_lu,
            'cree_le' => $this->created_at?->toIso8601String(),
            'il_y_a'  => $this->created_at?->locale('fr')->diffForHumans(),
        ];
    }
}