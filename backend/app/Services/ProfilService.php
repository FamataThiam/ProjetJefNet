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
    public function __construct(
        private UserRepositoryInterface $users,
        private MembreRepositoryInterface $membres,
    ) {}

  
    public function completer(User $user, array $donnees, ?UploadedFile $photo): User
    {
        if ($user->membre()->exists()) {
            throw new CompteException('Votre profil est déjà complété.', 'PROFIL_DEJA_COMPLETE', 409);
        }

        
        $cheminPhoto = $photo?->store('avatars', 'public');

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
                    'pays'               => $donnees['pays'] ?? 'Sénégal',
                    'photo_profil_path'  => $cheminPhoto,
                    'couleur_perso'      => '#0174AB',
                    'nombre_connexion'   => 1,
                    'derniere_connexion' => now(),
                ]);
            });
        } catch (\Throwable $e) {
          
            if ($cheminPhoto) {
                Storage::disk('public')->delete($cheminPhoto);
            }
            throw $e;
        }

        return $user->refresh()->load('statutCompte', 'membre');
    }
}