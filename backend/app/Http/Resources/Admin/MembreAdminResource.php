<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MembreAdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user   = $this->user;
        $profil = $this->profilProfessionnel;

        return [
            'membre_id'          => $this->id,
            'username'           => $this->username,
            'nom'                => trim(($user?->prenom ?? '') . ' ' . ($user?->nom ?? '')),
            'email'              => $user?->email,
            'telephone'          => $this->telephone,
            'ville'              => $this->ville,
            'photo_url'          => $this->photo_profil_path ? Storage::disk('public')->url($this->photo_profil_path) : null,
            'role'               => $profil ? 'PRESTATAIRE' : 'CLIENT',
            'titre_professionnel'=> $profil?->titre_professionnel,
            'statut_compte'      => $user?->statutCompte?->value,
            'est_administrateur' => $user?->administrateur !== null,
            'demandes_publiees'  => (int) ($this->demandes_count ?? 0),
            'inscrit_le'         => $this->created_at?->toIso8601String(),
            'derniere_connexion' => $this->derniere_connexion?->toIso8601String(),
        ];
    }
}