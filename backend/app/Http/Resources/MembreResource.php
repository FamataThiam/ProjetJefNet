<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MembreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Le membre est-il le propriétaire de ce profil (on peut voir les infos privées) ?
        $estProprietaire = $request->user()?->id === $this->user_id;

        return [
            'username'      => $this->username,
            'ville'         => $this->ville,
            'localite'      => $this->localite,
            'pays'          => $this->pays,
            'photo_url'     => $this->urlFichier($this->photo_profil_path),
            'couleur_perso' => $this->couleur_perso,

           
            'telephone'          => $this->when($estProprietaire, $this->telephone),
            'signature_url'      => $this->when($estProprietaire, fn () => $this->urlFichier($this->signature_electronique)),
            'derniere_connexion' => $this->when($estProprietaire, fn () => $this->derniere_connexion?->toIso8601String()),
            'nombre_connexion'   => $this->when($estProprietaire, $this->nombre_connexion),
        ];
    }

  
    private function urlFichier(?string $chemin): ?string
    {
        return $chemin ? Storage::disk('public')->url($chemin) : null;
    }
}