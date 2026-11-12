<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;

class MembreAdminDetailResource extends MembreAdminResource
{
    public function toArray(Request $request): array
    {
        $user   = $this->user;
        $profil = $this->profilProfessionnel;
        $admin  = $user?->bloquePar?->user;

        return array_merge(parent::toArray($request), [
            'localite'         => $this->localite,
            'pays'             => $this->pays,
            'nombre_connexion' => (int) $this->nombre_connexion,
            'email_verifie'    => (bool) $user?->est_email_verifie,
            'connexion_via'    => $user?->provider ?? 'email',

            'profil_professionnel' => $profil ? [
                'id'            => $profil->id,
                'titre'         => $profil->titre_professionnel,
                'certification' => $profil->statutCertification?->value,
                'note_moyenne'  => (float) $profil->note_moyenne,
            ] : null,

            
            'blocage' => $user?->statutCompte?->value === 'BLOQUE' ? [
                'motif'      => $user->motif_blocage,
                'bloque_le'  => $user->bloque_le?->toIso8601String(),
                'bloque_par' => $admin ? trim($admin->prenom . ' ' . $admin->nom) : null,
            ] : null,
        ]);
    }
}