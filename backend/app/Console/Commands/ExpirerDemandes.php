<?php

namespace App\Console\Commands;

use App\Repositories\Contracts\DemandeServiceRepositoryInterface;
use App\Services\DemandesService;
use App\Support\CodeListe;
use Illuminate\Console\Command;

class ExpirerDemandes extends Command
{
    protected $signature = 'demandes:expirer';

    protected $description = 'Passe en EXPIREE les demandes restées en attente plus de 7 jours';

    public function handle(DemandeServiceRepositoryInterface $demandes): int
    {
        $nombre = $demandes->expirer(
            now()->subDays(DemandesService::DUREE_VALIDITE_JOURS),
            CodeListe::id('StatutDemande', 'EN_ATTENTE'),
            CodeListe::id('StatutDemande', 'EXPIREE'),
        );

        $this->info("{$nombre} demande(s) expirée(s).");

        return self::SUCCESS;
    }
}