<?php

namespace App\Repositories\Eloquent;

use App\Models\Disponibilite;
use App\Repositories\Contracts\DisponibiliteRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class DisponibiliteRepository implements DisponibiliteRepositoryInterface
{
    
    public function aVenirPourProfil(int $profilId): Collection
    {
        return Disponibilite::where('profil_professionnel_id', $profilId)
            ->whereDate('jour_disponibilite', '>=', today())
            ->orderBy('jour_disponibilite')
            ->orderBy('heure_debut')
            ->get();
    }

  
    public function trouverPourProfil(int $id, int $profilId): Disponibilite
    {
        return Disponibilite::where('profil_professionnel_id', $profilId)->findOrFail($id);
    }


    public function chevauche(int $profilId, string $jour, string $debut, string $fin, ?int $saufId = null): bool
    {
        return Disponibilite::where('profil_professionnel_id', $profilId)
            ->whereDate('jour_disponibilite', $jour)
            ->when($saufId, fn ($q) => $q->where('id', '!=', $saufId))
            ->where('heure_debut', '<', $fin)
            ->where('heure_fin', '>', $debut)
            ->exists();
    }

    public function creer(array $donnees): Disponibilite
    {
        return Disponibilite::create($donnees);
    }

    public function modifier(Disponibilite $dispo, array $donnees): Disponibilite
    {
        $dispo->update($donnees);

        return $dispo;
    }

    public function supprimer(Disponibilite $dispo): void
    {
        $dispo->delete();
    }
}