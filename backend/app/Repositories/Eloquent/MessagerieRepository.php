<?php

namespace App\Repositories\Eloquent;

use App\Models\Conversation;
use App\Models\Message;
use App\Repositories\Contracts\MessagerieRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MessagerieRepository implements MessagerieRepositoryInterface
{
    private const RELATIONS_CONVERSATION = [
        'statut',
        'initiateur.user', 'initiateur.profilProfessionnel',
        'destinataire.user', 'destinataire.profilProfessionnel',
        'dernierMessage.type',
    ];

    private const RELATIONS_MESSAGE = ['type', 'expediteur.user', 'reponseA.expediteur.user', 'reponseA.type'];

    /* ----------------------------- Conversations ----------------------------- */

    public function entre(int $membreA, int $membreB): ?Conversation
    {
        return Conversation::query()
            ->where(fn ($q) => $q->where('initiateur_id', $membreA)->where('destinataire_id', $membreB))
            ->orWhere(fn ($q) => $q->where('initiateur_id', $membreB)->where('destinataire_id', $membreA))
            ->first();
    }

    public function creerConversation(array $donnees): Conversation
    {
        return Conversation::create($donnees);
    }

    public function modifierConversation(Conversation $conversation, array $donnees): Conversation
    {
        $conversation->update($donnees);

        return $conversation;
    }

    public function trouverPourMembre(string $uuid, int $membreId): Conversation
    {
        return Conversation::query()
            ->where('uuid', $uuid)
            ->where(fn ($q) => $q->where('initiateur_id', $membreId)->orWhere('destinataire_id', $membreId))
            ->with(self::RELATIONS_CONVERSATION)
            ->withCount(['messages as non_lus' => fn ($m) => $m->where('est_lu', false)->where('expediteur_id', '!=', $membreId)])
            ->firstOrFail();
    }

    public function conversationsDe(int $membreId, bool $archivees, int $parPage = 20): LengthAwarePaginator
    {
        return Conversation::query()
            ->where(fn ($q) => $q->where('initiateur_id', $membreId)->orWhere('destinataire_id', $membreId))
            ->whereHas('statut', fn ($s) => $s->where('value', $archivees ? 'ARCHIVEE' : 'ACTIVE'))
            ->has('messages')                                   // pas de conversation vide dans la liste
            ->with(self::RELATIONS_CONVERSATION)
            ->withCount(['messages as non_lus' => fn ($m) => $m->where('est_lu', false)->where('expediteur_id', '!=', $membreId)])
            ->orderByDesc('updated_at')                          // mise à jour à chaque message ($touches)
            ->orderByDesc('id')
            ->paginate($parPage)
            ->withQueryString();
    }

    /* -------------------------------- Messages ------------------------------- */

    public function messages(Conversation $conversation, int $parPage = 30): LengthAwarePaginator
    {
        return Message::query()
            ->where('conversation_id', $conversation->id)
            ->with(self::RELATIONS_MESSAGE)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($parPage)
            ->withQueryString();
    }

    public function creerMessage(array $donnees): Message
    {
        return Message::create($donnees)->load(self::RELATIONS_MESSAGE);
    }

    public function trouverMessage(int $id): ?Message
    {
        return Message::find($id);
    }

    public function marquerLus(Conversation $conversation, int $lecteurId): int
    {
        // Mise à jour en une seule requête (sans recharger chaque message)
        return Message::query()
            ->where('conversation_id', $conversation->id)
            ->where('expediteur_id', '!=', $lecteurId)
            ->where('est_lu', false)
            ->update(['est_lu' => true, 'updated_at' => now()]);
    }

    public function nombreNonLus(int $membreId): int
    {
        return Message::query()
            ->where('est_lu', false)
            ->where('expediteur_id', '!=', $membreId)
            ->whereHas('conversation', fn ($c) => $c->where(
                fn ($q) => $q->where('initiateur_id', $membreId)->orWhere('destinataire_id', $membreId)
            ))
            ->count();
    }
}