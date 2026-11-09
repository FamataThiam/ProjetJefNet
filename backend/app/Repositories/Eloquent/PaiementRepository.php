<?php

namespace App\Repositories\Eloquent;

use App\Models\Facture;
use App\Models\Paiement;
use App\Repositories\Contracts\PaiementRepositoryInterface;
use Illuminate\Support\Collection;

class PaiementRepository implements PaiementRepositoryInterface
{
    public function creer(array $donnees): Paiement
    {
        return Paiement::create($donnees);
    }

    public function modifier(Paiement $paiement, array $donnees): Paiement
    {
        $paiement->update($donnees);

        return $paiement;
    }

    public function pourReservation(int $reservationId): Collection
    {
        return Paiement::query()
            ->where('reservation_id', $reservationId)
            ->with(['mode', 'statut', 'facture'])
            ->latest('id')
            ->get();
    }

    public function actif(int $reservationId): ?Paiement
    {
        return Paiement::query()
            ->where('reservation_id', $reservationId)
            ->whereHas('statut', fn ($s) => $s->whereIn('value', ['PAYEE', 'EN_ATTENTE']))
            ->with(['mode', 'statut'])
            ->latest('id')
            ->first();
    }

    public function creerFacture(Paiement $paiement, array $donnees): Facture
    {
        return $paiement->facture()->create($donnees);
    }
}