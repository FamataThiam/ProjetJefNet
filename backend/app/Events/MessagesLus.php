<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class MessagesLus implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public string $conversationUuid,
        public int $lecteurId,
        public int $nombre,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('conversation.' . $this->conversationUuid);
    }

 
    public function broadcastAs(): string
    {
        return 'messages.lus';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_uuid' => $this->conversationUuid,
            'lecteur_id'        => $this->lecteurId,
            'nombre'            => $this->nombre,
            'lus_le'            => now()->toIso8601String(),
        ];
    }
}