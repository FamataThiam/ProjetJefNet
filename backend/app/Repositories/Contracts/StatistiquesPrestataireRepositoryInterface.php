<?php

namespace App\Repositories\Contracts;

use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

interface StatistiquesPrestataireRepositoryInterface
{
    
    public function chiffreAffaires(int $profilId, CarbonInterface $debut, CarbonInterface $fin): array;

   
    public function parStatut(int $profilId, ?CarbonInterface $debut = null, ?CarbonInterface $fin = null, string $colonneDate = 'r.created_at'): array;

    
    public function clients(int $profilId): array;

  
    public function delaiConfirmation(int $profilId, CarbonInterface $debut, CarbonInterface $fin): ?float;

    
    public function evolutionMensuelle(int $profilId, CarbonInterface $debut): array;

    public function chiffreAffairesParService(int $profilId): Collection;

    public function moyensPaiement(int $profilId): Collection;

    public function originesClients(int $profilId, int $limite = 6): Collection;

    
    public function activite(int $profilId): Collection;

   
    public function entonnoir(int $profilId): array;

  

    public function reservationsAConfirmer(int $profilId, int $limite = 5): Collection;

    public function especesAConfirmer(int $profilId): Collection;

    public function rapportsARediger(int $profilId): Collection;

    public function prochainesInterventions(int $profilId, int $jours = 7): Collection;

    public function derniersAvis(int $profilId, int $limite = 3): Collection;
}