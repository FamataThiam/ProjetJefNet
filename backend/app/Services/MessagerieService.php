<?php

namespace App\Services;

use App\Events\MessageEnvoye;
use App\Events\MessagesLus;
use App\Exceptions\MessagerieException;
use App\Models\Conversation;
use App\Models\Membre;
use App\Models\Message;
use App\Repositories\Contracts\MessagerieRepositoryInterface;
use App\Support\CodeListe;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class MessagerieService
{
    private const DISQUE = 'local';           
    private const DOSSIER = 'messagerie';

    public function __construct(private MessagerieRepositoryInterface $messagerie) {}

    

    public function demarrer(Membre $moi, int $destinataireId): Conversation
    {
        if ($moi->id === $destinataireId) {
            throw MessagerieException::soiMeme();
        }

        $destinataire = Membre::with('user.statutCompte')->findOrFail($destinataireId);
        $this->verifierDisponible($destinataire);

        $conversation = $this->messagerie->entre($moi->id, $destinataireId)
            ?? $this->messagerie->creerConversation([
                'initiateur_id'   => $moi->id,
                'destinataire_id' => $destinataireId,
                'statut_id'       => CodeListe::id('StatutConversation', 'ACTIVE'),
            ]);

        return $this->messagerie->trouverPourMembre($conversation->uuid, $moi->id);
    }

    

    public function mesConversations(Membre $moi, bool $archivees = false): LengthAwarePaginator
    {
        return $this->messagerie->conversationsDe($moi->id, $archivees);
    }

    public function consulter(Membre $moi, string $uuid): Conversation
    {
        return $this->messagerie->trouverPourMembre($uuid, $moi->id);
    }

    public function messages(Membre $moi, string $uuid): LengthAwarePaginator
    {
        return $this->messagerie->messages($this->consulter($moi, $uuid));
    }

    public function nombreNonLus(Membre $moi): int
    {
        return $this->messagerie->nombreNonLus($moi->id);
    }

    

    public function envoyer(Membre $moi, string $uuid, ?string $contenu, ?UploadedFile $fichier, bool $vocal, ?int $reponseAId): Message
    {
        $conversation = $this->consulter($moi, $uuid);
        $contenu      = $contenu !== null ? trim($contenu) : null;

        if (($contenu === null || $contenu === '') && ! $fichier) {
            throw MessagerieException::messageVide();
        }

       
        $autre = $conversation->interlocuteur($moi)->loadMissing('user.statutCompte');
        $this->verifierDisponible($autre);

        
        if ($reponseAId) {
            $cible = $this->messagerie->trouverMessage($reponseAId);
            if (! $cible || $cible->conversation_id !== $conversation->id) {
                throw MessagerieException::reponseInvalide();
            }
        }

        $type   = $this->typeDe($fichier, $vocal);
        $chemin = $fichier ? $this->stocker($fichier, $conversation, $vocal) : null;

        try {
            $message = DB::transaction(function () use ($conversation, $moi, $contenu, $type, $chemin, $reponseAId) {
             
                if ($conversation->statut?->value === 'ARCHIVEE') {
                    $this->messagerie->modifierConversation($conversation, [
                        'statut_id' => CodeListe::id('StatutConversation', 'ACTIVE'),
                    ]);
                }

                return $this->messagerie->creerMessage([
                    'conversation_id' => $conversation->id,
                    'expediteur_id'   => $moi->id,
                    'reponse_a_id'    => $reponseAId,
                    'contenu'         => $contenu ?: null,
                    'type_message_id' => CodeListe::id('TypeMessage', $type),
                    'fichier_url'     => $chemin,
                    'est_lu'          => false,
                ]);
            });
        } catch (Throwable $e) {
            if ($chemin) {
                Storage::disk(self::DISQUE)->delete($chemin); 
            }
            throw $e;
        }

       
        $this->diffuser(fn () => broadcast(new MessageEnvoye(
            $message,
            $conversation,
            $autre->id,
            $this->messagerie->nombreNonLus($autre->id),
        ))->toOthers());

        return $message;
    }

  

    /** @return array{0: int, 1: int} [messages marqués, total de non lus restants] */
    public function marquerLus(Membre $moi, string $uuid): array
    {
        $conversation = $this->consulter($moi, $uuid);
        $nombre       = $this->messagerie->marquerLus($conversation, $moi->id);

        if ($nombre > 0) {
            $this->diffuser(fn () => broadcast(new MessagesLus($conversation->uuid, $moi->id, $nombre))->toOthers());
        }

        return [$nombre, $this->messagerie->nombreNonLus($moi->id)];
    }

 

    public function archiver(Membre $moi, string $uuid, bool $archiver): Conversation
    {
        $conversation = $this->consulter($moi, $uuid);

        $this->messagerie->modifierConversation($conversation, [
            'statut_id' => CodeListe::id('StatutConversation', $archiver ? 'ARCHIVEE' : 'ACTIVE'),
        ]);

        return $this->consulter($moi, $uuid);
    }

    

    public function cheminFichier(int $messageId): string
    {
        $message = Message::findOrFail($messageId);

        if (! $message->fichier_url || ! Storage::disk(self::DISQUE)->exists($message->fichier_url)) {
            abort(404);
        }

        return $message->fichier_url;
    }

   

    private function verifierDisponible(Membre $membre): void
    {
        if (! in_array($membre->user?->statutCompte?->value, ['ACTIF', 'SIGNALE'], true)) {
            throw MessagerieException::interlocuteurIndisponible();
        }
    }

   
    private function typeDe(?UploadedFile $fichier, bool $vocal): string
    {
        if (! $fichier) {
            return 'TEXTE';
        }

        $mime = (string) $fichier->getMimeType();

        return match (true) {
            $vocal, str_starts_with($mime, 'audio/') => 'AUDIO',   
            str_starts_with($mime, 'image/')         => 'IMAGE',
            str_starts_with($mime, 'video/')         => 'VIDEO',
            default                                  => 'FICHIER',
        };
    }

   
    private function stocker(UploadedFile $fichier, Conversation $conversation, bool $vocal): string
    {
        $extension = strtolower($fichier->getClientOriginalExtension() ?: ($fichier->guessExtension() ?: 'bin'));
        $nom       = $vocal ? 'vocal' : (Str::slug(pathinfo($fichier->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'fichier');

        return $fichier->storeAs(
            self::DOSSIER . '/' . $conversation->id,
            Str::random(16) . '_' . Str::limit($nom, 60, '') . '.' . $extension,
            self::DISQUE,
        );
    }

    
    private function diffuser(callable $envoi): void
    {
        DB::afterCommit(function () use ($envoi) {
            try {
                $envoi();
            } catch (Throwable $e) {
                report($e);
            }
        });
    }
}