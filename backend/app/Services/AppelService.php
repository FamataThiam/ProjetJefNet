<?php

namespace App\Services;

use App\Events\AppelEntrant;
use App\Events\AppelTermine;
use App\Events\MessageEnvoye;
use App\Exceptions\MessagerieException;
use App\Http\Resources\Publication\PublicationResource;
use App\Models\Conversation;
use App\Models\Membre;
use App\Repositories\Contracts\MessagerieRepositoryInterface;
use App\Support\CodeListe;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Throwable;


class AppelService
{
    public function __construct(
        private MessagerieRepositoryInterface $messagerie,
        private DailyService $daily,
    ) {}

    
    public function lancer(Membre $moi, string $uuid): array
    {
        $conversation = $this->messagerie->trouverPourMembre($uuid, $moi->id);
        $autre        = $conversation->interlocuteur($moi)->loadMissing('user.statutCompte');

        if (! in_array($autre->user?->statutCompte?->value, ['ACTIF', 'SIGNALE'], true)) {
            throw MessagerieException::interlocuteurIndisponible();
        }

       
        if ($ancien = Cache::pull($this->cle($uuid))) {
            $this->daily->supprimerSalle($ancien['salle']);
        }

        $salle = $this->daily->creerSalle();
        $jeton = $this->daily->jeton($salle['nom'], $this->nomCourt($moi), true);

        Cache::put($this->cle($uuid), [
            'salle'        => $salle['nom'],
            'url'          => $salle['url'],
            'appelant'     => $moi->id,
            'destinataire' => $autre->id,
            'expire_le'    => $salle['expire_le'],
            'lance_le'     => now()->toIso8601String(),
            'decroche_le'  => null,                       // rempli quand le destinataire rejoint
        ], now()->addMinutes(DailyService::DUREE_MINUTES));

        $this->diffuser(new AppelEntrant($uuid, $autre->id, [
            'membre_id' => $moi->id,
            'nom'       => $this->nomCourt($moi),
            'photo_url' => PublicationResource::url($moi->photo_profil_path),
        ], $salle['expire_le']));

        return ['url' => $salle['url'], 'jeton' => $jeton, 'expire_le' => $salle['expire_le']];
    }

 
    public function rejoindre(Membre $moi, string $uuid): array
    {
        $this->messagerie->trouverPourMembre($uuid, $moi->id);     

        $appel = Cache::get($this->cle($uuid));
        if (! $appel || ! in_array($moi->id, [$appel['appelant'], $appel['destinataire']], true)) {
            throw MessagerieException::appelTermine();
        }

        // Le destinataire décroche : on note l'heure pour calculer la durée de l'appel
        if ($moi->id === $appel['destinataire'] && empty($appel['decroche_le'])) {
            $appel['decroche_le'] = now()->toIso8601String();
            Cache::put($this->cle($uuid), $appel, Carbon::parse($appel['lance_le'])->addMinutes(DailyService::DUREE_MINUTES));
        }

        return [
            'url'       => $appel['url'],
            'jeton'     => $this->daily->jeton($appel['salle'], $this->nomCourt($moi)),
            'expire_le' => $appel['expire_le'],
        ];
    }

   
    public function terminer(Membre $moi, string $uuid, string $raison): void
    {
        $conversation = $this->messagerie->trouverPourMembre($uuid, $moi->id);

        $appel = Cache::pull($this->cle($uuid));
        if (! $appel) {
            return;                                                  // déjà terminé : rien à faire
        }

        $this->daily->supprimerSalle($appel['salle']);

        $autre = $moi->id === $appel['appelant'] ? $appel['destinataire'] : $appel['appelant'];
        $this->diffuser(new AppelTermine($uuid, $autre, $raison, $moi->id));

        $this->tracerAppel($conversation, $appel);
    }



    /** Laisse une trace de l'appel dans la conversation : « Appel vidéo (4 min) » ou « Appel vidéo manqué ». */
    private function tracerAppel(Conversation $conversation, array $appel): void
    {
        try {
            $minutes = ! empty($appel['decroche_le'])
                ? max(1, (int) ceil(Carbon::parse($appel['decroche_le'])->diffInSeconds(now()) / 60))
                : null;

            $message = $this->messagerie->creerMessage([
                'conversation_id' => $conversation->id,
                'expediteur_id'   => $appel['appelant'],
                'reponse_a_id'    => null,
                'contenu'         => $minutes ? "Appel vidéo ({$minutes} min)" : 'Appel vidéo manqué',
                'type_message_id' => CodeListe::id('TypeMessage', 'APPEL_VIDEO'),
                'fichier_url'     => null,
                'est_lu'          => false,
            ]);

            // Le message apparaît en direct chez le destinataire, comme un message normal
            $this->diffuser(new MessageEnvoye(
                $message,
                $conversation,
                $appel['destinataire'],
                $this->messagerie->nombreNonLus($appel['destinataire']),
            ));
        } catch (Throwable $e) {
            // La trace est un plus : si elle échoue, l'appel est quand même terminé
            report($e);
        }
    }

    private function cle(string $uuid): string
    {
        return 'appel:' . $uuid;
    }

    private function nomCourt(Membre $membre): string
    {
        $user = $membre->user;

        return trim($user->prenom . ' ' . mb_substr((string) $user->nom, 0, 1) . '.');
    }

    private function diffuser(object $evenement): void
    {
        try {
            broadcast($evenement);
        } catch (Throwable $e) {
            report($e);
        }
    }
}