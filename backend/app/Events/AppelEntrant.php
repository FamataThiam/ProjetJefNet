<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;


class AppelEntrant implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(
        public string $conversationUuid,
        public int $destinataireId,
        public array $appelant,          
        public string $expireLe,
    ) {}


    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('membre.' . $this->destinataireId);
    }

   
    public function broadcastAs(): string
    {
        return 'appel.entrant';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_uuid' => $this->conversationUuid,
            'appelant'          => $this->appelant,
            'expire_le'         => $this->expireLe,
        ];
    }
}