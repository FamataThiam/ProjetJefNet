<?php

namespace App\Services;

use App\Mail\CodeOtpMail;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use App\Exceptions\CompteException;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Contracts\User as SocialUser;


class AuthService
{
    public function __construct(
        private UserRepositoryInterface $users,
        private CodeListService $codeLists,
        private OtpService $otp,
    ) {}

    
    public function inscrire(array $donnees): User
    {
        $user = DB::transaction(fn () => $this->users->create([
            'prenom'            => $donnees['prenom'],
            'nom'               => $donnees['nom'],
            'email'             => $donnees['email'],
            'password'          => $donnees['password'],   // haché automatiquement par le modèle
            'statut_compte_id'  => $this->codeLists->idOf('StatutCompte', 'ACTIF'),
            'est_email_verifie' => false,
        ]));

        $this->envoyerCode($user, 'verification');

        return $user;
    }

    public function verifierEmail(string $email, string $code): array
    {
        $user = $this->users->findByEmail($email);

        if (! $user || $user->est_email_verifie
            || ! $this->otp->verifier('verification', $user->email, $code)) {
            throw ValidationException::withMessages([
                'code' => 'Code invalide ou expiré.',
            ]);
        }

        $user = $this->users->update($user, ['est_email_verifie' => true]);

        return [
            'user'  => $user,
            'token' => $user->createToken('jefnet')->plainTextToken,
        ];
    }

    public function envoyerCode(User $user, string $objet): void
    {
        $code = $this->otp->generer($objet, $user->email);

        Mail::to($user->email)->send(new CodeOtpMail($user->prenom, $code, $objet));
    }


      
    public function renvoyerCodeVerification(string $email): void
    {
        $user = $this->users->findByEmail($email);

        
        if ($user && ! $user->est_email_verifie) {
            $this->envoyerCode($user, 'verification');
        }
    }


     
    public function connecter(string $email, string $password): array
    {
        $user = $this->users->findByEmail($email);

       
        if (! $user || ! Hash::check($password, (string) $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'Identifiants incorrects.',
            ]);
        }

     
        if (! $user->est_email_verifie) {
            throw new CompteException(
                'Veuillez vérifier votre adresse e-mail avant de vous connecter.',
                'EMAIL_NON_VERIFIE'
            );
        }

      
        if ($user->statutCompte?->value !== 'ACTIF') {
            throw new CompteException(
                "Votre compte n'est pas actif. Contactez l'administration JefNet.",
                'COMPTE_INACTIF'
            );
        }

      
        $this->users->enregistrerConnexion($user);

        return [
            'user'  => $user,
            'token' => $user->createToken('jefnet')->plainTextToken,
        ];
    }



     public function deconnecter(User $user): void
    {
    
        $user->currentAccessToken()?->delete();
    }



        
    public function demanderReinitialisation(string $email): void
    {
        $user = $this->users->findByEmail($email);

        
        if ($user) {
            $this->envoyerCode($user, 'reinitialisation');
        }
    }



       
    public function reinitialiserMotDePasse(string $email, string $code, string $password): void
    {
        $user = $this->users->findByEmail($email);

        if (! $user || ! $this->otp->verifier('reinitialisation', $user->email, $code)) {
            throw ValidationException::withMessages([
                'code' => 'Code invalide ou expiré.',
            ]);
        }

        DB::transaction(function () use ($user, $password) {
            $this->users->update($user, [
                'password'          => $password,   // haché automatiquement par le cast 'hashed'
                'est_email_verifie' => true,
            ]);
            $this->users->supprimerTousLesJetons($user);
        });
    }



        
    public function connecterViaProvider(string $provider, SocialUser $social): array
    {
        $email = strtolower((string) $social->getEmail());

        if ($email === '') {
            throw new CompteException(
                "Votre compte $provider ne partage pas d'adresse e-mail. Utilisez une autre méthode de connexion.",
                'EMAIL_INDISPONIBLE',
                422
            );
        }

   
        $user = $this->users->findByProvider($provider, (string) $social->getId())
             ?? $this->users->findByEmail($email);

        if (! $user) {
           
            [$prenom, $nom] = $this->separerNom($social->getName(), $social->getNickname());

            $user = $this->users->create([
                'prenom'            => $prenom,
                'nom'               => $nom,
                'email'             => $email,
                'password'          => null,
                'provider'          => $provider,
                'provider_id'       => (string) $social->getId(),
                'statut_compte_id'  => $this->codeLists->idOf('StatutCompte', 'ACTIF'),
                'est_email_verifie' => true,
            ]);
        } elseif (! $user->est_email_verifie) {
       
            $user = $this->users->update($user, ['est_email_verifie' => true]);
        }

    
        if ($user->statutCompte?->value !== 'ACTIF') {
            throw new CompteException(
                "Votre compte n'est pas actif. Contactez l'administration JefNet.",
                'COMPTE_INACTIF'
            );
        }

      
        $this->users->enregistrerConnexion($user);

        return [
            'user'  => $user,
            'token' => $user->createToken('jefnet-' . $provider)->plainTextToken,
        ];
    }

 
    private function separerNom(?string $nomComplet, ?string $pseudo): array
    {
        $nomComplet = trim((string) $nomComplet) ?: trim((string) $pseudo) ?: 'Utilisateur';
        $parties    = preg_split('/\s+/', $nomComplet, 2);

        return [$parties[0], $parties[1] ?? ''];
    }
    
}