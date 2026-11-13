<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;


class AppelTermine implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(
        public string $conversationUuid,
        public int $autreMembreId,
        public string $raison,
        public int $parMembreId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('membre.' . $this->autreMembreId),            
            new PrivateChannel('conversation.' . $this->conversationUuid),   
        ];
    }

   
    public function broadcastAs(): string
    {
        return 'appel.termine';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_uuid' => $this->conversationUuid,
            'raison'            => $this->raison,
            'par_membre_id'     => $this->parMembreId,
        ];
    }
}