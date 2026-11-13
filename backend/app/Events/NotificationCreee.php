<?php

namespace App\Events;

use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Envoyée en direct au membre à chaque nouvelle notification
 * (réservation, demande, paiement, avis, certification, publication...).
 */
class NotificationCreee implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public Notification $notification,
        public int $nonLues,
    ) {}

    /** Canal privé du membre concerné. */
    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('membre.' . $this->notification->membre_id);
    }

    /** Nom écouté par le front : .notification.creee */
    public function broadcastAs(): string
    {
        return 'notification.creee';
    }

    public function broadcastWith(): array
    {
        return [
            'notification' => (new NotificationResource($this->notification->loadMissing('type')))->resolve(),
            'non_lues'     => $this->nonLues,
        ];
    }
}