<?php

use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Canaux privés temps réel
|--------------------------------------------------------------------------
| $user = l'utilisateur du token Sanctum. On renvoie true pour autoriser l'écoute.
| Les canaux publics (fil, publication.{id}) n'ont pas besoin d'être déclarés ici.
*/

// Canal personnel d'un membre : notifications, statuts, appel entrant, déconnexion forcée
Broadcast::channel('membre.{membreId}', function ($user, int $membreId) {
    return $user->membre?->id === $membreId;
});

// Une conversation : seulement ses 2 participants
Broadcast::channel('conversation.{uuid}', function ($user, string $uuid) {
    $membreId = $user->membre?->id;

    return $membreId !== null && Conversation::where('uuid', $uuid)
        ->where(fn ($q) => $q->where('initiateur_id', $membreId)->orWhere('destinataire_id', $membreId))
        ->exists();
});

// Les administrateurs (demandes de certification à traiter…)
Broadcast::channel('admin', function ($user) {
    return $user->administrateur !== null;
});