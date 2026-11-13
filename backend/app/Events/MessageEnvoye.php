<?php

namespace App\Events;

use App\Http\Resources\Messagerie\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;


class MessageEnvoye implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public Message $message,
        public Conversation $conversation,
        public int $destinataireId,
        public int $nonLusDestinataire,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->conversation->uuid),
            new PrivateChannel('membre.' . $this->destinataireId),
        ];
    }

  
    public function broadcastAs(): string
    {
        return 'message.envoye';
    }

    public function broadcastWith(): array
    {
        $expediteur = $this->message->expediteur?->user;

        return [
            'conversation_uuid' => $this->conversation->uuid,
           'message'           => collect((new MessageResource($this->message))->resolve())->except('est_moi')->all(),
           
            'expediteur_nom'    => $expediteur ? trim($expediteur->prenom . ' ' . mb_substr((string) $expediteur->nom, 0, 1) . '.') : null,
            'apercu'            => MessageResource::apercu($this->message),
            'non_lus_total'     => $this->nonLusDestinataire,       
        ];
    }
}