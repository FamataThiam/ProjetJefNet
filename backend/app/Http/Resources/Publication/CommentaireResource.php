<?php

namespace App\Http\Resources\Publication;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentaireResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $auteur = $this->auteur;
        $user   = $auteur?->user;
        $moi    = $request->user()?->membre?->id;

        return [
            'id'             => $this->id,
            'publication_id' => $this->publication_id,
            'parent_id'      => $this->parent_id,
            'contenu'        => $this->contenu,
            'cree_le'        => $this->created_at?->toIso8601String(),
            'il_y_a'         => $this->created_at?->locale('fr')->diffForHumans(),

            'auteur' => [
                'membre_id' => $auteur?->id,
                'nom'       => trim(($user?->prenom ?? '') . ' ' . ($user?->nom ?? '')),
                'username'  => $auteur?->username,
                'photo_url' => PublicationResource::url($auteur?->photo_profil_path),
            ],

            'peut_supprimer' => $moi !== null && $moi === $auteur?->id,

           
            'reponses'    => self::collection($this->whenLoaded('reponses')),
            'nb_reponses' => $this->whenLoaded('reponses', fn () => $this->reponses->count()),
        ];
    }
}