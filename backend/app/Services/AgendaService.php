<?php

namespace App\Services;

use App\Exceptions\ProfilProException;
use App\Models\Disponibilite;
use App\Models\Membre;
use App\Repositories\Contracts\DisponibiliteRepositoryInterface;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class AgendaService
{
    public function __construct(
        private ProfilProfessionnelRepositoryInterface $profils,
        private DisponibiliteRepositoryInterface $dispos,
    ) {}

    public function lister(Membre $membre): Collection
    {
        return $this->dispos->aVenirPourProfil($this->profilId($membre));
    }

    public function ajouter(Membre $membre, array $donnees): Disponibilite
    {
        $profilId = $this->profilId($membre);

        if ($this->dispos->chevauche($profilId, $donnees['jour_disponibilite'], $donnees['heure_debut'], $donnees['heure_fin'])) {
            throw ProfilProException::creneauChevauche();
        }

        return $this->dispos->creer($donnees + [
            'profil_professionnel_id' => $profilId,
            'est_disponible'          => true,
        ]);
    }

    public function modifier(Membre $membre, int $id, array $donnees): Disponibilite
    {
        $profilId = $this->profilId($membre);
        $dispo    = $this->dispos->trouverPourProfil($id, $profilId);

        if (! $dispo->est_disponible) {
            throw ProfilProException::creneauReserve();
        }

        // Valeurs finales = valeurs envoyées, sinon valeurs actuelles
        $jour  = $donnees['jour_disponibilite'] ?? $dispo->jour_disponibilite->format('Y-m-d');
        $debut = $donnees['heure_debut'] ?? substr($dispo->heure_debut, 0, 5);
        $fin   = $donnees['heure_fin'] ?? substr($dispo->heure_fin, 0, 5);

        if ($fin <= $debut) {
            throw ValidationException::withMessages([
                'heure_fin' => "L'heure de fin doit être après l'heure de début.",
            ]);
        }

        if ($this->dispos->chevauche($profilId, $jour, $debut, $fin, $dispo->id)) {
            throw ProfilProException::creneauChevauche();
        }

        if ($donnees) {
            $this->dispos->modifier($dispo, $donnees);
        }

        return $dispo;
    }

    public function supprimer(Membre $membre, int $id): void
    {
        $dispo = $this->dispos->trouverPourProfil($id, $this->profilId($membre));

        if (! $dispo->est_disponible) {
            throw ProfilProException::creneauReserve();
        }

        $this->dispos->supprimer($dispo);
    }

    private function profilId(Membre $membre): int
    {
        return ($this->profils->trouverParMembre($membre->id)
            ?? throw ProfilProException::pasPrestataire())->id;
    }
}