<?php

namespace App\Http\Resources\Messagerie;

use App\Http\Resources\Publication\PublicationResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $moi    = $request->user()?->membre;
        $autre  = $moi ? $this->interlocuteur($moi) : $this->destinataire;
        $user   = $autre?->user;
        $profil = $autre?->profilProfessionnel;
        $dernier = $this->dernierMessage;

        return [
            'uuid'   => $this->uuid,
            'statut' => $this->statut?->value,                    

            'interlocuteur' => [
                'membre_id'      => $autre?->id,
                'nom'            => trim(($user?->prenom ?? '') . ' ' . ($user?->nom ?? '')),
                'username'       => $autre?->username,
                'photo_url'      => PublicationResource::url($autre?->photo_profil_path),
                'est_prestataire'=> $profil !== null,
                'profil_id'      => $profil?->id,
                'titre'          => $profil?->titre_professionnel,
            ],

            'dernier_message' => $dernier ? [
                'apercu'    => MessageResource::apercu($dernier),
                'de_moi'    => $moi !== null && $dernier->expediteur_id === $moi->id,
                'envoye_le' => $dernier->created_at?->toIso8601String(),
                'il_y_a'    => $dernier->created_at?->locale('fr')->diffForHumans(),
            ] : null,

            'non_lus'        => (int) ($this->non_lus ?? 0),
            'mise_a_jour_le' => $this->updated_at?->toIso8601String(),
        ];
    }
}