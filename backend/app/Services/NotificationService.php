<?php

namespace App\Services;

use App\Models\Notification;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use App\Support\CodeListe;

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
}