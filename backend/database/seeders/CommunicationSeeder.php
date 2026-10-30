<?php

namespace Database\Seeders;

use App\Models\Avis;
use App\Models\Conversation;
use App\Models\DemandeService;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Paiement;
use App\Models\ProfilProfessionnel;
use App\Models\Reservation;
use App\Services\CodeListService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class CommunicationSeeder extends Seeder
{
    public function __construct(private CodeListService $codeLists) {}

    public function run(): void
    {
        $this->conversations();
        $this->notifications();
    }

    

    private function conversations(): void
    {
        $reservations = Reservation::with(['client.user', 'prestataire.membre', 'details.service.domaine'])->orderBy('created_at')->get();

        foreach ($reservations as $reservation) {
            $client = $reservation->client;
            $presta = $reservation->prestataire->membre;

           
            $existe = Conversation::where(fn ($q) => $q->where('initiateur_id', $client->id)->where('destinataire_id', $presta->id))
                ->orWhere(fn ($q) => $q->where('initiateur_id', $presta->id)->where('destinataire_id', $client->id))
                ->exists();
            if ($existe) {
                continue;
            }

            $debut = $reservation->created_at->copy()->subHours(fake()->numberBetween(2, 48));

            $conversation = new Conversation([
                'initiateur_id'   => $client->id,
                'destinataire_id' => $presta->id,
                'statut_id'       => $this->codeLists->idOf('StatutConversation', fake()->boolean(90) ? 'ACTIVE' : 'ARCHIVEE'),
            ]);
            $this->dater($conversation, $debut);

            $service = $reservation->details->first()->service;
            $this->dialogue($conversation, $client->id, $presta->id, $service->nom, $service->domaine->libelle, $debut);
        }
    }

   
    private function dialogue(Conversation $conversation, int $client, int $presta, string $service, string $domaine, Carbon $date): void
    {
        $image = 'domaines/' . \Illuminate\Support\Str::slug(explode(' ', $domaine)[0]) . '.jpg';

        $script = [
            [$client, 'TEXTE', "Bonjour, je vous contacte pour : $service. Êtes-vous disponible cette semaine ?", null],
            [$presta, 'TEXTE', 'Bonjour ! Oui, je suis disponible. Pouvez-vous m\'envoyer une photo pour que je voie le travail ?', null],
            [$client, 'IMAGE', null, $image],
            [$presta, 'TEXTE', 'Merci, c\'est bien noté. Vous pouvez réserver directement sur mon profil.', 'reponse'],
            [$client, 'TEXTE', 'Parfait, je réserve tout de suite. Merci !', null],
            [$presta, 'TEXTE', 'Avec plaisir, à bientôt !', null],
        ];

        $nombre    = fake()->numberBetween(3, count($script));
        $precedent = null;

        foreach (array_slice($script, 0, $nombre) as $i => [$auteur, $type, $contenu, $extra]) {
            $date = $date->copy()->addMinutes(fake()->numberBetween(2, 180));
            $dernier = $i === $nombre - 1;

            $message = new Message([
                'conversation_id' => $conversation->id,
                'expediteur_id'   => $auteur,
                
                'reponse_a_id'    => $extra === 'reponse' ? $precedent?->id : null,
                'contenu'         => $contenu,
                'type_message_id' => $this->codeLists->idOf('TypeMessage', $type),
                'fichier_url'     => $type === 'IMAGE' ? $extra : null,
                
                'est_lu'          => ! ($dernier && $date->gt(now()->subDays(2))),
            ]);
            $this->dater($message, $date);
            $precedent = $message;
        }
    }



    private function notifications(): void
    {
       
        foreach (Reservation::with(['client.user', 'prestataire'])->get() as $r) {
            $lien = "/reservations/{$r->uuid}";
            $this->notifier($r->prestataire->membre_id, 'RESERVATION', 'Nouvelle réservation',
                "{$r->client->user->prenom} a réservé pour le {$r->date_prevue->format('d/m/Y')}.", $lien, $r->created_at);

            if ($r->date_confirmation) {
                $this->notifier($r->membre_id, 'RESERVATION', 'Réservation confirmée',
                    "Votre réservation du {$r->date_prevue->format('d/m/Y')} a été confirmée.", $lien, $r->date_confirmation);
            }
        }

        $prestataires = ProfilProfessionnel::with(['services', 'membre'])->get();
        $enAttente    = $this->codeLists->idOf('StatutDemande', 'EN_ATTENTE');

        foreach (DemandeService::with('membre')->where('statut_id', $enAttente)->get() as $d) {
            $concernes = $prestataires->filter(fn ($p) =>
                $p->membre_id !== $d->membre_id
                && $p->membre->ville === $d->membre->ville
                && $p->services->contains('domaine_id', $d->domaine_id));

            foreach ($concernes as $p) {
                $this->notifier($p->membre_id, 'NOUVELLE_DEMANDE', 'Nouvelle demande près de chez vous',
                    "« {$d->titre} » à {$d->membre->localite}.", "/demandes/{$d->uuid}", $d->created_at);
            }
        }

       
        $payee = $this->codeLists->idOf('StatutPaiement', 'PAYEE');
        foreach (Paiement::with('reservation.prestataire')->where('statut_id', $payee)->get() as $p) {
            $this->notifier($p->reservation->prestataire->membre_id, 'PAIEMENT', 'Paiement reçu',
                number_format($p->montant, 0, ',', ' ') . ' FCFA reçus pour une réservation.', "/reservations/{$p->reservation->uuid}", $p->date_paiement);
        }

      
        foreach (Avis::with('reservation.prestataire')->get() as $a) {
            $this->notifier($a->reservation->prestataire->membre_id, 'AVIS', 'Nouvel avis',
                "Vous avez reçu une note de {$a->note}/5.", '/profil/avis', $a->created_at);
        }

      
        $certifie = $this->codeLists->idOf('StatutProfil', 'CERTIFIE');
        foreach (ProfilProfessionnel::where('statut_certification_id', $certifie)->get() as $p) {
            $this->notifier($p->membre_id, 'PROFIL', 'Profil certifié 🎉',
                'Félicitations ! Votre badge « certifié » est maintenant visible sur votre profil.', '/profil', now()->subDays(fake()->numberBetween(5, 40)));
        }
    }

    private function notifier(int $membreId, string $type, string $titre, string $contenu, string $lien, $date): void
    {
        $date = Carbon::parse($date);

        $notification = new Notification([
            'membre_id' => $membreId,
            'type_id'   => $this->codeLists->idOf('TypeNotification', $type),
            'titre'     => $titre,
            'contenu'   => $contenu,
            'lien'      => $lien,
          
            'est_lu'    => $date->lt(now()->subDays(3)) || fake()->boolean(50),
        ]);
        $this->dater($notification, $date);
    }

   
    private function dater($modele, $date): void
    {
        $modele->timestamps = false;
        $modele->created_at = $date;
        $modele->updated_at = $date;
        $modele->save();
    }
}