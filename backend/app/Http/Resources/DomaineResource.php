<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class DomaineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'=> $this->id,
            'libelle'=> $this->libelle,
            'description' => $this->description,
            'image_url'=> $this->image_path ? Storage::disk('public')->url($this->image_path) : null,
            'nombre_prestataires'=> $this->whenHas('nombre_prestataires', fn ($n) => (int) $n),
        ];
    }
}