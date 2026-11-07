<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class MaDisponibiliteResource extends DisponibiliteResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'est_disponible' => (bool) $this->est_disponible,   
        ]);
    }
}