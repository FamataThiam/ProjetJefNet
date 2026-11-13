<?php

namespace App\Services;

use App\Models\Membre;
use App\Models\Notification;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use App\Support\CodeListe;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Events\NotificationCreee;
use Illuminate\Support\Facades\DB;
use Throwable;

class NotificationService
{
    public function __construct(private NotificationRepositoryInterface $notifications) {}

   
        public function notifier(int $membreId, string $type, string $titre, string $contenu, ?string $lien = null): Notification
    {
        $notification = $this->notifications->creer([
            'membre_id' => $membreId,
            'type_id'   => CodeListe::id('TypeNotification', $type),
            'titre'     => $titre,
            'contenu'   => $contenu,
            'lien'      => $lien,
            'est_lu'    => false,
        ]);

        // Envoi en direct, APRÈS la validation de la transaction :
        // si l'action échoue (rollback), le membre ne reçoit rien.
        DB::afterCommit(function () use ($notification, $membreId) {
            try {
                broadcast(new NotificationCreee($notification, $this->notifications->nombreNonLues($membreId)));
            } catch (Throwable $e) {
                // Serveur temps réel arrêté : la notification reste enregistrée,
                // le membre la verra en rechargeant. On n'empêche pas l'action.
                report($e);
            }
        });

        return $notification;
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