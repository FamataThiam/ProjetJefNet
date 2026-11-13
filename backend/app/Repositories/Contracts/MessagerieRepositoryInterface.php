<?php

namespace App\Repositories\Contracts;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface MessagerieRepositoryInterface
{
    
    public function entre(int $membreA, int $membreB): ?Conversation;

    public function creerConversation(array $donnees): Conversation;

    public function modifierConversation(Conversation $conversation, array $donnees): Conversation;

    
    public function trouverPourMembre(string $uuid, int $membreId): Conversation;

    
    public function conversationsDe(int $membreId, bool $archivees, int $parPage = 20): LengthAwarePaginator;

   
    public function messages(Conversation $conversation, int $parPage = 30): LengthAwarePaginator;

    public function creerMessage(array $donnees): Message;

    public function trouverMessage(int $id): ?Message;

   
    public function marquerLus(Conversation $conversation, int $lecteurId): int;

  
    public function nombreNonLus(int $membreId): int;
}