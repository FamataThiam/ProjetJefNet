<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class OtpService
{
    private const DUREE_MINUTES = 10;
    private const ESSAIS_MAX    = 5;

   
    public function generer(string $objet, string $email): string
    {
        $code = (string) random_int(100000, 999999);

        Cache::put($this->cle($objet, $email), [
            'hash'   => Hash::make($code),
            'essais' => 0,
        ], now()->addMinutes(self::DUREE_MINUTES));

        return $code;
    }


    public function verifier(string $objet, string $email, string $code): bool
    {
        $cle    = $this->cle($objet, $email);
        $donnee = Cache::get($cle);

        if (! $donnee || $donnee['essais'] >= self::ESSAIS_MAX) {
            return false;   
        }

        if (! Hash::check($code, $donnee['hash'])) {
            $donnee['essais']++;
            Cache::put($cle, $donnee, now()->addMinutes(self::DUREE_MINUTES));
            return false;
        }

        Cache::forget($cle);  
        return true;
    }

    
    private function cle(string $objet, string $email): string
    {
        return 'otp:' . $objet . ':' . strtolower($email);
    }
}