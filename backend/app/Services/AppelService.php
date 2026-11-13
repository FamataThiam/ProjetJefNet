<?php

namespace App\Services;

use App\Events\AppelEntrant;
use App\Events\AppelTermine;
use App\Exceptions\MessagerieException;
use App\Http\Resources\Publication\PublicationResource;
use App\Models\Membre;
use App\Repositories\Contracts\MessagerieRepositoryInterface;
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

        return [
            'url'       => $appel['url'],
            'jeton'     => $this->daily->jeton($appel['salle'], $this->nomCourt($moi)),
            'expire_le' => $appel['expire_le'],
        ];
    }

   
    public function terminer(Membre $moi, string $uuid, string $raison): void
    {
        $this->messagerie->trouverPourMembre($uuid, $moi->id);

        $appel = Cache::pull($this->cle($uuid));
        if (! $appel) {
            return;                                                  // déjà terminé : rien à faire
        }

        $this->daily->supprimerSalle($appel['salle']);

        $autre = $moi->id === $appel['appelant'] ? $appel['destinataire'] : $appel['appelant'];
        $this->diffuser(new AppelTermine($uuid, $autre, $raison, $moi->id));
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