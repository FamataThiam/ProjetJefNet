<?php

namespace App\Http\Resources\Publication;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PublicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profil  = $this->prestataire;
        $membre  = $profil?->membre;
        $user    = $membre?->user;
        $moi     = $request->user()?->membre?->id;
        $date    = $this->date_publication ?? $this->created_at;

        return [
            'id'          => $this->id,
            'titre'       => $this->titre,
            'description' => $this->description,
            'publiee_le'  => $date?->toIso8601String(),
            'il_y_a'      => $date?->locale('fr')->diffForHumans(),
            'est_active'  => (bool) $this->est_active,

            'prestataire' => [
                'profil_id' => $profil?->id,
                'membre_id' => $membre?->id,
                'nom'       => trim(($user?->prenom ?? '') . ' ' . ($user?->nom ?? '')),
                'username'  => $membre?->username,
                'photo_url' => self::url($membre?->photo_profil_path),
                'titre'     => $profil?->titre_professionnel,
                'ville'     => $membre?->ville,
                'localite'  => $membre?->localite,
                'certifie'  => $profil?->statutCertification?->value === 'CERTIFIE',
            ],

            'medias' => $this->medias->map(fn ($m) => [
                'id'    => $m->id,
                'type'  => $m->type?->value,            // IMAGE ou VIDEO
                'url'   => self::url($m->url),
                'ordre' => (int) $m->ordre,
            ])->values(),

            'nb_commentaires' => (int) ($this->nb_commentaires ?? 0),

           
            'est_auteur'   => $moi !== null && $moi === $membre?->id,
            'deja_reserve' => (bool) ($this->deja_reserve ?? false),

           
            'score' => $this->when(isset($this->score), fn () => round((float) $this->score, 1)),
        ];
    }

   
    public static function url(?string $chemin): ?string
    {
        if (! $chemin) {
            return null;
        }

        return str_starts_with($chemin, 'http') ? $chemin : Storage::disk('public')->url($chemin);
    }
}