<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AvisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $auteur = $this->reservation?->membre?->user;

        return [
            'id'          => $this->id,
            'note'        => $this->note,
            'commentaire' => $this->commentaire,
            'date'        => $this->created_at?->format('Y-m-d'),
            'auteur'      => $auteur ? $auteur->prenom . ' ' . mb_substr($auteur->nom, 0, 1) . '.' : null,
        ];
    }
}