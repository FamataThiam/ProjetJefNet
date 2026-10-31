<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\CompteException;
use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class SocialAuthController extends Controller
{
    public function __construct(private AuthService $auth) {}

   
    public function redirect(string $provider): RedirectResponse
    {
        return Socialite::driver($provider)->stateless()->redirect();
    }

   
    public function callback(string $provider): RedirectResponse
    {
        try {
            $social = Socialite::driver($provider)->stateless()->user();
        } catch (Throwable) {
          
            return $this->versFrontend(['erreur' => 'CONNEXION_ANNULEE']);
        }

        try {
            $resultat = $this->auth->connecterViaProvider($provider, $social);
        } catch (CompteException $e) {
            return $this->versFrontend(['erreur' => $e->codeErreur()]);
        }

        return $this->versFrontend(['token' => $resultat['token']]);
    }

 
    private function versFrontend(array $donnees): RedirectResponse
    {
        return redirect()->away(
            config('services.frontend_url') . '/auth/callback#' . http_build_query($donnees)
        );
    }
}