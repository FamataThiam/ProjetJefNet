<?php

namespace App\Repositories\Eloquent;

use App\Models\Avis;
use App\Repositories\Contracts\AvisRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class AvisRepository implements AvisRepositoryInterface
{
    public function pourReservation(int $reservationId): ?Avis
    {
        return Avis::where('reservation_id', $reservationId)->first();
    }

    public function creer(array $donnees): Avis
    {
        return Avis::create($donnees);
    }

    public function modifier(Avis $avis, array $donnees): Avis
    {
        $avis->update($donnees);

        return $avis;
    }

    public function pourPrestataire(int $profilId, int $parPage = 10): LengthAwarePaginator
    {
        return $this->duPrestataire($profilId)
            ->with(['reservation.membre.user', 'reservation.details.service'])
            ->orderByDesc('avis.created_at')
            ->paginate($parPage);
    }

    public function statistiques(int $profilId): array
    {
        // Nombre d'avis pour chaque note : [5 => 12, 4 => 3, ...]
        $parNote = $this->duPrestataire($profilId)
            ->selectRaw('note, COUNT(*) AS total')
            ->groupBy('note')
            ->pluck('total', 'note');

        $total = (int) $parNote->sum();

        $repartition = [];
        foreach ([5, 4, 3, 2, 1] as $note) {
            $repartition[$note] = (int) ($parNote[$note] ?? 0);
        }

        $somme = collect($repartition)->map(fn ($n, $note) => $n * $note)->sum();

        return [
            'moyenne'     => $total ? round($somme / $total, 2) : 0,
            'total'       => $total,
            'repartition' => $repartition,
        ];
    }

    /** Avis des réservations de ce prestataire. */
    private function duPrestataire(int $profilId): Builder
    {
        return Avis::query()->whereHas(
            'reservation',
            fn ($r) => $r->where('profil_professionnel_id', $profilId)
        );
    }
}