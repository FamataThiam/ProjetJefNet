<?php

namespace App\Models\Concerns;

use App\Events\DonneesModifiees;
use Illuminate\Support\Facades\DB;
use Throwable;


trait DiffuseEnDirect
{
    
    private static array $colonnesIgnorees = [
        'updated_at', 'derniere_connexion', 'nombre_connexion', 'remember_token', 'password',
    ];

    public static function bootDiffuseEnDirect(): void
    {
        static::created(fn ($modele) => $modele->diffuserChangement('created'));
        static::updated(fn ($modele) => $modele->diffuserChangement('updated'));
        static::deleted(fn ($modele) => $modele->diffuserChangement('deleted'));
    }

    /** Par défaut, aucun membre en particulier (l'admin reçoit toujours le signal). */
    public function membresConcernes(): array
    {
        return [];
    }

    protected function diffuserChangement(string $action): void
    {
        // Pas de signal pendant les seeders, migrations et commandes artisan
        if (app()->runningInConsole()) {
            return;
        }

       
        if ($action === 'updated'
            && empty(array_diff(array_keys($this->getChanges()), self::$colonnesIgnorees))) {
            return;
        }

        try {
            $evenement = new DonneesModifiees(
                ressource: property_exists($this, 'ressourceTempsReel') ? $this->ressourceTempsReel : $this->getTable(),
                action:    $action,
                id: (int) (method_exists($this, 'idTempsReel') ? $this->idTempsReel() : $this->getKey()),
                membres:   $this->membresConcernes(),
                public:    property_exists($this, 'diffusionPublique') && $this->diffusionPublique,
            );
        } catch (Throwable $e) {
            report($e);
            return;
        }

        
        DB::afterCommit(function () use ($evenement) {
            try {
                broadcast($evenement);
            } catch (Throwable $e) {
                report($e);
            }
        });
    }
}