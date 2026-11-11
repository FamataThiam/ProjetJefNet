<?php

namespace App\Repositories\Contracts;

use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

interface StatistiquesPlateformeRepositoryInterface
{
    
    public function membres(CarbonInterface $debut, CarbonInterface $fin): array;          // total, nouveaux
    public function prestatairesActifs(): int;
    public function volumeAffaires(CarbonInterface $debut, CarbonInterface $fin): array;   // montant, nombre
    public function nombreReservations(CarbonInterface $debut, CarbonInterface $fin): int;
    public function demandesParStatut(?CarbonInterface $debut = null, ?CarbonInterface $fin = null): array;
    public function noteMoyenne(): array;                                                  // moyenne, total
    public function certificationsParStatut(): array;

   
    public function evolutionMensuelle(CarbonInterface $debut): array;
    public function reservationsParStatut(): array;
    public function domaines(int $limite = 8): Collection;
    public function meilleursPrestataires(int $limite = 5): Collection;
    public function moyensPaiement(): Collection;
    public function membresParVille(): Collection;
    public function besoinsNonCouverts(int $limite = 10): Collection;
    public function positionsPrestataires(): Collection;
    public function activite(): Collection;

    public function certificationsEnAttente(): Collection;
    public function especesEnRetard(int $heures = 48): Collection;
    public function derniersInscrits(int $limite = 5): Collection;
    public function annulationsRecentes(int $limite = 5): Collection;
}