<?php

namespace App\Services;

use App\Exceptions\MessagerieException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;


class DailyService
{
 
    public const DUREE_MINUTES = 60;

    /**
     * Crée une salle PRIVÉE : 2 personnes maximum, elle expire toute seule.
     * @return array{nom: string, url: string, expire_le: string}
     */
    public function creerSalle(): array
    {
        $expiration = now()->addMinutes(self::DUREE_MINUTES);

        $reponse = $this->appel(fn (PendingRequest $http) => $http->post('/rooms', [
            'name'       => 'jefnet-' . Str::lower(Str::random(12)),
            'privacy'    => 'private',                       // entrée seulement avec un jeton
            'properties' => [
                'exp'               => $expiration->timestamp,
                'eject_at_room_exp' => true,                 // tout le monde sort à l'expiration
                'max_participants'  => 2,
                'enable_chat'       => false,                // le chat, c'est notre messagerie
                'enable_knocking'   => false,
                'lang'              => 'fr',
            ],
        ]));

        return [
            'nom'       => $reponse['name'],
            'url'       => $reponse['url'],
            'expire_le' => $expiration->toIso8601String(),
        ];
    }

 
    public function jeton(string $salle, string $nom, bool $proprietaire = false): string
    {
        $reponse = $this->appel(fn (PendingRequest $http) => $http->post('/meeting-tokens', [
            'properties' => [
                'room_name' => $salle,
                'user_name' => $nom,
                'is_owner'  => $proprietaire,
                'exp'       => now()->addMinutes(self::DUREE_MINUTES)->timestamp,
            ],
        ]));

        return $reponse['token'];
    }

  
    public function supprimerSalle(string $salle): void
    {
        try {
            $this->client()->delete('/rooms/' . $salle);
        } catch (Throwable $e) {
            report($e);
        }
    }

   

    private function client(): PendingRequest
    {
        return Http::baseUrl(config('services.daily.url'))
            ->withToken((string) config('services.daily.key'))
            ->acceptJson()
            ->timeout(10);
    }


    private function appel(callable $requete): array
    {
        if (! config('services.daily.key')) {
            throw MessagerieException::appelIndisponible();
        }

        try {
            $reponse = $requete($this->client());
        } catch (Throwable $e) {
            report($e);
            throw MessagerieException::appelIndisponible();
        }

        if ($reponse->failed()) {
            report(new \RuntimeException('Daily.co : ' . $reponse->status() . ' ' . $reponse->body()));
            throw MessagerieException::appelIndisponible();
        }

        return $reponse->json();
    }
}