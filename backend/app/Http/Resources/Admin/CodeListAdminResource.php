<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CodeListAdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'type'        => $this->type,
            'valeur'      => $this->value,
            'description' => $this->description,
            'etat'        => $this->active ? 'ACTIF' : 'INACTIF',
            'systeme'     => $this->estSysteme(),   // true : ne peut pas être désactivée
            'cree_le'     => $this->created_at?->toIso8601String(),
            'modifie_le'  => $this->updated_at?->toIso8601String(),
        ];
    }
}