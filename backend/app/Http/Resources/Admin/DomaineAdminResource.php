<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class DomaineAdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'=> $this->id,
            'libelle' => $this->libelle,
            'description' => $this->description,
            'image_url' => $this->image_path ? Storage::disk('public')->url($this->image_path) : null,
            'est_actif' => (bool) $this->est_actif,
            'services'  => (int) ($this->services_count ?? 0),
            'services_actifs' => (int) ($this->services_actifs_count ?? 0),
            'prestataires'=> (int) ($this->prestataires_count ?? 0),
            'demandes' => (int) ($this->demandes_count ?? 0),
            'cree_le' => $this->created_at?->toIso8601String(),
            'modifie_le' => $this->updated_at?->toIso8601String(),
        ];
    }
}