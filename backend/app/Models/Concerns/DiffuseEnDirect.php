<?php

namespace App\Models\Concerns;

use App\Events\DonneesModifiees;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * À ajouter dans un modèle (use DiffuseEnDirect;) :
 * chaque création / modification / suppression envoie un signal temps réel.
 *
 * Réglages facultatifs dans le modèle :
 *   protected string $ressourceTempsReel = 'prestataires';  // nom écouté par le front (par défaut : la table)
 *   protected bool   $diffusionPublique  = true;            // signal visible par tous
 *   public function membresConcernes(): array { ... }      // membres prévenus en privé
 */
trait DiffuseEnDirect
{
    /** Colonnes dont le changement seul ne mérite pas de signal. */
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

        // Une simple mise à jour de "dernière connexion" ne déclenche rien
        if ($action === 'updated'
            && empty(array_diff(array_keys($this->getChanges()), self::$colonnesIgnorees))) {
            return;
        }

        try {
            $evenement = new DonneesModifiees(
                ressource: property_exists($this, 'ressourceTempsReel') ? $this->ressourceTempsReel : $this->getTable(),
                action:    $action,
                id:        (int) $this->getKey(),
                membres:   $this->membresConcernes(),
                public:    property_exists($this, 'diffusionPublique') && $this->diffusionPublique,
            );
        } catch (Throwable $e) {
            report($e);
            return;
        }

        // Envoi seulement si la transaction réussit ; une erreur n'empêche jamais l'action
        DB::afterCommit(function () use ($evenement) {
            try {
                broadcast($evenement);
            } catch (Throwable $e) {
                report($e);
            }
        });
    }
}