<?php

namespace App\Repositories\Contracts;

use App\Models\Facture;
use App\Models\Paiement;
use Illuminate\Support\Collection;

interface PaiementRepositoryInterface
{
    public function creer(array $donnees): Paiement;

    public function modifier(Paiement $paiement, array $donnees): Paiement;

  
    public function pourReservation(int $reservationId): Collection;

    
    public function actif(int $reservationId): ?Paiement;

   
    public function creerFacture(Paiement $paiement, array $donnees): Facture;
}