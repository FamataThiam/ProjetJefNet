<?php

namespace App\Services;

use App\Exceptions\CompteException;
use App\Models\User;
use App\Repositories\Contracts\MembreRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProfilService
{
    // Dossier des photos envoyées par les membres (les seules qu'on a le droit de supprimer)
    private const DOSSIER_PHOTOS = 'avatars/membres';
    private const DOSSIER_SIGNATURES = 'signatures/membres';

    public function __construct(
        private UserRepositoryInterface $users,
        private MembreRepositoryInterface $membres,
        private CodeListService $codeLists,
    ) {}

    // Cas d'utilisation « Compléter mon profil »
    public function completer(User $user, array $donnees, ?UploadedFile $photo): User
    {
        if ($user->membre()->exists()) {
            throw new CompteException('Votre profil est déjà complété.', 'PROFIL_DEJA_COMPLETE', 409);
        }

        // La photo est enregistrée AVANT la transaction (le disque n'est pas transactionnel)
        $cheminPhoto = $photo?->store(self::DOSSIER_PHOTOS, 'public');

        try {
            DB::transaction(function () use ($user, $donnees, $cheminPhoto) {
                $this->users->update($user, [
                    'prenom' => $donnees['prenom'],
                    'nom'    => $donnees['nom'],
                ]);

                $this->membres->create([
                    'user_id'            => $user->id,
                    'username'           => $donnees['username'],
                    'telephone'          => $donnees['telephone'],
                    'ville'              => $donnees['ville'],
                    'localite'           => $donnees['localite'],
                    'pays'               => 'Sénégal',
                    'photo_profil_path'  => $cheminPhoto,
                    'couleur_perso'      => '#0174AB',
                    'nombre_connexion'   => 1,
                    'derniere_connexion' => now(),
                ]);
            });
        } catch (\Throwable $e) {
            // Échec : on supprime la photo pour ne pas laisser de fichier orphelin
            if ($cheminPhoto) {
                Storage::disk('public')->delete($cheminPhoto);
            }
            throw $e;
        }

        return $user->refresh()->load('statutCompte', 'membre');
    }

    // Cas d'utilisation « Modifier mon profil »
    public function modifier(User $user, array $donnees): User
    {
        // prenom et nom → table users ; le reste → table membres
        $champsUser   = array_intersect_key($donnees, array_flip(['prenom', 'nom']));
        $champsMembre = array_diff_key($donnees, $champsUser);

        DB::transaction(function () use ($user, $champsUser, $champsMembre) {
            if ($champsUser) {
                $this->users->update($user, $champsUser);
            }
            if ($champsMembre) {
                $this->membres->update($user->membre, $champsMembre);
            }
        });

        return $user->refresh()->load('statutCompte', 'membre');
    }

       // Cas d'utilisation « Changer ma photo de profil »
    public function changerPhoto(User $user, UploadedFile $photo): User
    {
        return $this->remplacerFichier($user, $photo, 'photo_profil_path', self::DOSSIER_PHOTOS);
    }

    // Cas d'utilisation « Ajouter / changer ma signature »
    public function changerSignature(User $user, UploadedFile $signature): User
    {
        return $this->remplacerFichier($user, $signature, 'signature_electronique', self::DOSSIER_SIGNATURES);
    }

    // Logique commune : enregistrer le nouveau fichier, mettre à jour la colonne,
    // puis supprimer l'ancien fichier SEULEMENT s'il a été envoyé par le membre
    private function remplacerFichier(User $user, UploadedFile $fichier, string $colonne, string $dossier): User
    {
        $membre        = $user->membre;
        $ancienChemin  = $membre->{$colonne};
        $nouveauChemin = $fichier->store($dossier, 'public');

        try {
            $this->membres->update($membre, [$colonne => $nouveauChemin]);
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($nouveauChemin);
            throw $e;
        }

        if ($ancienChemin && str_starts_with($ancienChemin, $dossier . '/')) {
            Storage::disk('public')->delete($ancienChemin);
        }

        return $user->refresh()->load('statutCompte', 'membre');
    }



     public function changerMotDePasse(User $user, string $nouveauMotDePasse): void
    {
        $jetonActuelId = $user->currentAccessToken()->id;

        DB::transaction(function () use ($user, $nouveauMotDePasse, $jetonActuelId) {
            $this->users->update($user, ['password' => $nouveauMotDePasse]);   // haché par le cast 'hashed'
            $this->users->supprimerAutresJetons($user, $jetonActuelId);
        });
    }



        // Cas d'utilisation « Désactiver mon compte »
    public function desactiver(User $user): void
    {
        DB::transaction(function () use ($user) {
            $this->users->update($user, [
                'statut_compte_id' => $this->codeLists->idOf('StatutCompte', 'INACTIF'),
            ]);
            $this->users->supprimerTousLesJetons($user);
        });
    }
}