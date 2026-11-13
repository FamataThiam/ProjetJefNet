<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Signal générique "cette ressource a changé".
 * Ne contient AUCUNE donnée : le front recharge par l'API, qui vérifie les droits.
 */
class DonneesModifiees implements ShouldBroadcastNow
{
    use Dispatchable;

    /**
     * @param string $ressource ex. "reservations", "membres", "prestataires"
     * @param string $action    created | updated | deleted
     * @param int    $id        identifiant de la ligne concernée
     * @param int[]  $membres   membres concernés (canaux privés membre.{id})
     * @param bool   $public    true = visible par tous (profils, services, publications...)
     */
    public function __construct(
        public string $ressource,
        public string $action,
        public int $id,
        public array $membres = [],
        public bool $public = false,
    ) {}

    public function broadcastOn(): array
    {
        $canaux = [new PrivateChannel('admin')];   // l'admin voit tout

        foreach (array_unique(array_filter($this->membres)) as $membreId) {
            $canaux[] = new PrivateChannel('membre.' . $membreId);
        }

        if ($this->public) {
            $canaux[] = new Channel('public');
        }

        return $canaux;
    }

    /** Nom écouté par le front : .donnees.modifiees */
    public function broadcastAs(): string
    {
        return 'donnees.modifiees';
    }

    public function broadcastWith(): array
    {
        return [
            'ressource' => $this->ressource,
            'action'    => $this->action,
            'id'        => $this->id,
        ];
    }
}