<?php

namespace App\Services;

use App\Exceptions\PublicationException;
use App\Http\Requests\Publication\PublicationRequest;
use App\Models\Membre;
use App\Models\Publication;
use App\Repositories\Contracts\PublicationRepositoryInterface;
use App\Support\CodeListe;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class PublicationService
{
    public function __construct(
        private PublicationRepositoryInterface $publications,
        private NotificationService $notifications,
    ) {}

    

    /** @param UploadedFile[] $fichiers */
    public function publier(Membre $membre, array $donnees, array $fichiers): Publication
    {
        $profil = $membre->profilProfessionnel ?? throw PublicationException::pasPrestataire();

        $this->verifierMedias(0, 0, $fichiers);

        $stockes = [];

        try {
            $publication = DB::transaction(function () use ($profil, $donnees, $fichiers, &$stockes) {
                $publication = $this->publications->creer([
                    'profil_professionnel_id' => $profil->id,
                    'titre'                   => $donnees['titre'],
                    'description'             => $donnees['description'] ?? null,
                    'date_publication'        => now(),
                    'est_active'              => true,
                ]);

                $this->enregistrerMedias($publication, $fichiers, 1, $stockes);

                return $publication;
            });
        } catch (Throwable $e) {
         
            Storage::disk('public')->delete($stockes);
            throw $e;
        }

        $this->prevenirAnciensClients($profil->id, $membre, $publication);

        return $this->publications->trouver($publication->id);
    }

   

    public function mesPublications(Membre $membre): LengthAwarePaginator
    {
        $profil = $membre->profilProfessionnel ?? throw PublicationException::pasPrestataire();

        return $this->publications->duPrestataire($profil->id, true);
    }

    /** @param UploadedFile[] $fichiers  @param int[] $aSupprimer */
    public function modifier(Membre $membre, int $id, array $donnees, array $fichiers, array $aSupprimer): Publication
    {
        $profil      = $membre->profilProfessionnel ?? throw PublicationException::pasPrestataire();
        $publication = $this->publications->trouverPourPrestataire($id, $profil->id);

       
        $restants = $publication->medias->reject(fn ($m) => in_array($m->id, $aSupprimer, true));
        $videos   = $restants->filter(fn ($m) => $m->type?->value === 'VIDEO')->count();
        $this->verifierMedias($restants->count(), $videos, $fichiers);

        $retires = $publication->medias->filter(fn ($m) => in_array($m->id, $aSupprimer, true));
        $stockes = [];

        try {
            DB::transaction(function () use ($publication, $donnees, $fichiers, $retires, $restants, &$stockes) {
                $modifs = array_intersect_key($donnees, array_flip(['titre', 'description']));
                if ($modifs) {
                    $this->publications->modifier($publication, $modifs);
                }

                $retires->each->delete();

              
                $ordre = 1;
                foreach ($restants->sortBy('ordre') as $media) {
                    $media->update(['ordre' => $ordre++]);
                }
                $this->enregistrerMedias($publication, $fichiers, $ordre, $stockes);
            });
        } catch (Throwable $e) {
            Storage::disk('public')->delete($stockes);
            throw $e;
        }

      
        $this->effacerFichiers($retires->pluck('url')->all());

        return $this->publications->trouver($publication->id);
    }

    public function supprimer(Membre $membre, int $id): void
    {
        $profil      = $membre->profilProfessionnel ?? throw PublicationException::pasPrestataire();
        $publication = $this->publications->trouverPourPrestataire($id, $profil->id);
        $fichiers    = $publication->medias->pluck('url')->all();

        DB::transaction(fn () => $this->publications->supprimer($publication));

        $this->effacerFichiers($fichiers);
    }


    public function consulter(Membre $lecteur, int $id): Publication
    {
        $publication = $this->publications->trouverVisible($id);
        $reserves    = $this->publications->prestatairesReservesPar($lecteur->id);
        $publication->setAttribute('deja_reserve', in_array($publication->profil_professionnel_id, $reserves, true));

        return $publication;
    }

    
    public function duPrestataire(?Membre $lecteur, int $profilId): LengthAwarePaginator
    {
        $proprietaire = $lecteur?->profilProfessionnel?->id === $profilId;

        return $this->publications->duPrestataire($profilId, $proprietaire);
    }

    

    public function masquer(int $id, string $motif): Publication
    {
        $publication = $this->publications->trouver($id);

        if (! $publication->est_active) {
            throw PublicationException::dejaMasquee();
        }

        $this->publications->modifier($publication, ['est_active' => false]);

        $this->notifications->notifier(
            $publication->prestataire->membre_id,
            'PUBLICATION',
            'Publication masquée',
            "Votre publication « {$publication->titre} » a été masquée par l'administration JefNet. Motif : {$motif}",
            '/mes-publications',
        );

        return $this->publications->trouver($id);
    }

    public function reafficher(int $id): Publication
    {
        $publication = $this->publications->trouver($id);

        if ($publication->est_active) {
            throw PublicationException::dejaVisible();
        }

        $this->publications->modifier($publication, ['est_active' => true]);

        $this->notifications->notifier(
            $publication->prestataire->membre_id,
            'PUBLICATION',
            'Publication de nouveau visible',
            "Votre publication « {$publication->titre} » est de nouveau visible dans le fil.",
            '/publications/' . $publication->id,
        );

        return $this->publications->trouver($id);
    }

    
    private function verifierMedias(int $dejaPresents, int $videosPresentes, array $fichiers): void
    {
        if ($dejaPresents + count($fichiers) > PublicationRequest::MAX_MEDIAS) {
            throw PublicationException::tropDeMedias(PublicationRequest::MAX_MEDIAS);
        }

        $nouvellesVideos = collect($fichiers)->filter(fn ($f) => str_starts_with((string) $f->getMimeType(), 'video/'))->count();

        if ($videosPresentes + $nouvellesVideos > 1) {
            throw PublicationException::uneSeuleVideo();
        }
    }

    private function enregistrerMedias(Publication $publication, array $fichiers, int $ordre, array &$stockes): void
    {
        foreach ($fichiers as $fichier) {
            $estVideo = str_starts_with((string) $fichier->getMimeType(), 'video/');
            $chemin   = $fichier->store("publications/{$publication->id}", 'public');
            $stockes[] = $chemin;

            $this->publications->ajouterMedia($publication, [
                'type_id' => CodeListe::id('TypeMedia', $estVideo ? 'VIDEO' : 'IMAGE'),
                'url'     => $chemin,
                'ordre'   => $ordre++,
            ]);
        }
    }

    private function effacerFichiers(array $chemins): void
    {
        $locaux = array_filter($chemins, fn ($c) => $c && ! str_starts_with($c, 'http'));
        Storage::disk('public')->delete($locaux);
    }

  
    private function prevenirAnciensClients(int $profilId, Membre $auteur, Publication $publication): void
    {
        $nom = $this->nomCourt($auteur);

        foreach ($this->publications->clientsDuPrestataire($profilId) as $clientId) {
            if ($clientId === $auteur->id) {
                continue;
            }

            $this->notifications->notifier(
                $clientId,
                'PUBLICATION',
                'Nouvelle réalisation',
                "{$nom}, que vous avez déjà réservé, a publié « {$publication->titre} ».",
                '/publications/' . $publication->id,
            );
        }
    }

    private function nomCourt(Membre $membre): string
    {
        $user = $membre->user;

        return trim($user->prenom . ' ' . mb_substr((string) $user->nom, 0, 1) . '.');
    }

        public function listerAdmin(?string $etat): LengthAwarePaginator
    {
        return $this->publications->listerAdmin($etat);
    }
}