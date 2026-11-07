<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class MonServiceResource extends ServiceResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'est_actif' => (bool) $this->est_actif,
            'cree_le'   => $this->created_at?->toIso8601String(),
        ]);
    }
}