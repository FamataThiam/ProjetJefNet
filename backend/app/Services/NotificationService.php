<?php

namespace App\Services;

use App\Models\Membre;
use App\Models\Notification;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use App\Support\CodeListe;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationService
{
    public function __construct(private NotificationRepositoryInterface $notifications) {}

   
    public function notifier(int $membreId, string $type, string $titre, string $contenu, ?string $lien = null): Notification
    {
        return $this->notifications->creer([
            'membre_id' => $membreId,
            'type_id'   => CodeListe::id('TypeNotification', $type),
            'titre'     => $titre,
            'contenu'   => $contenu,
            'lien'      => $lien,
            'est_lu'    => false,
        ]);
    }

   
    public function lister(Membre $membre, bool $nonLuesSeulement = false): LengthAwarePaginator
    {
        return $this->notifications->pourMembre($membre->id, $nonLuesSeulement);
    }

   
    public function nombreNonLues(Membre $membre): int
    {
        return $this->notifications->nombreNonLues($membre->id);
    }

   
    public function marquerLue(Membre $membre, int $id): Notification
    {
        $notification = $this->notifications->trouverPourMembre($membre->id, $id);

        return $this->notifications->marquerLue($notification);
    }


    public function toutMarquerLu(Membre $membre): int
    {
        return $this->notifications->toutMarquerLu($membre->id);
    }
}