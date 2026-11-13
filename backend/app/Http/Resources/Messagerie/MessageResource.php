<?php

namespace App\Http\Resources\Messagerie;

use App\Http\Resources\Publication\PublicationResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $expediteur = $this->expediteur;
        $user       = $expediteur?->user;
        $moi        = $request->user()?->membre?->id;
        $reponse    = $this->relationLoaded('reponseA') ? $this->reponseA : null;

        return [
            'id'              => $this->id,
            'conversation_id' => $this->conversation_id,
            'type'            => $this->type?->value,               // TEXTE, IMAGE, AUDIO, VIDEO, FICHIER
            'contenu'         => $this->contenu,

            'fichier' => $this->fichier_url ? [
                'url' => URL::temporarySignedRoute('messages.fichier', now()->addHour(), ['id' => $this->id]),
                'nom' => Str::after(basename($this->fichier_url), '_'),
            ] : null,

            'expediteur' => [
                'membre_id' => $expediteur?->id,
                'nom'       => trim(($user?->prenom ?? '') . ' ' . ($user?->nom ?? '')),
                'photo_url' => PublicationResource::url($expediteur?->photo_profil_path),
            ],
            'est_moi' => $moi !== null && $moi === $expediteur?->id,
            'est_lu'  => (bool) $this->est_lu,

          
            'reponse_a' => $reponse ? [
                'id'         => $reponse->id,
                'apercu'     => self::apercu($reponse),
                'expediteur' => $reponse->expediteur?->user?->prenom,
            ] : null,

            'envoye_le' => $this->created_at?->toIso8601String(),
            'heure'     => $this->created_at?->format('H:i'),
        ];
    }

    /** Texte court pour la liste des conversations et les citations. */
    public static function apercu($message): string
    {
        return match ($message?->type?->value) {
            'IMAGE'   => 'Photo',
            'AUDIO'   => 'Message vocal',
            'VIDEO'   => 'Vidéo',
            'FICHIER' => 'Fichier',
            default   => Str::limit((string) $message?->contenu, 80),
        };
    }
}