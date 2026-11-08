<?php

namespace App\Services;

use App\Models\DemandeService;
use App\Models\Membre;
use App\Repositories\Contracts\DemandeServiceRepositoryInterface;
use App\Support\CodeListe;
use App\Exceptions\DemandeException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DemandesService
{
    public const DUREE_VALIDITE_JOURS = 7;

    public function __construct(private DemandeServiceRepositoryInterface $demandes) {}

    public function publier(Membre $membre, array $donnees): DemandeService
    {
        $demande = $this->demandes->creer($donnees + [
            'membre_id' => $membre->id,
            'statut_id' => CodeListe::id('StatutDemande', 'EN_ATTENTE'),
        ]);

        return $demande->load(['domaine', 'statut']);
    }


    public function mesDemandes(Membre $membre, ?string $statut = null): LengthAwarePaginator
{
    return $this->demandes->pourMembre($membre->id, $statut);
}

public function maDemande(Membre $membre, string $uuid): DemandeService
{
    return $this->demandes->trouverPourMembre($membre->id, $uuid);
}

public function annuler(Membre $membre, string $uuid): DemandeService
{
    $demande = $this->demandes->trouverPourMembre($membre->id, $uuid);

    if ($demande->statut->value !== 'EN_ATTENTE') {
        throw DemandeException::nonAnnulable($demande->statut->value);
    }

    $this->demandes->modifier($demande, [
        'statut_id' => CodeListe::id('StatutDemande', 'ANNULEE'),
    ]);

    return $demande->load(['domaine', 'statut']);
}
}