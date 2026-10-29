<?php

namespace Database\Seeders;

use App\Models\CodeList;
use Illuminate\Database\Seeder;

class CodeListSeeder extends Seeder
{
    public function run(): void
    {
        $listes = [
            'StatutCompte'       => ['ACTIF', 'INACTIF', 'BLOQUE', 'SIGNALE'],
            'NiveauAcces'        => ['SUPER_ADMIN', 'ADMIN', 'MODERATEUR'],
            'TypeNotification'   => ['RESERVATION', 'NOUVELLE_DEMANDE', 'PAIEMENT', 'AVIS', 'PUBLICATION', 'PROFIL'],
            'StatutConversation' => ['ACTIVE', 'ARCHIVEE'],
            'TypeMessage'        => ['TEXTE', 'IMAGE', 'AUDIO', 'VIDEO', 'FICHIER'],
            'TypeMedia'          => ['IMAGE', 'VIDEO'],
            'RayonIntervention'  => ['LOCALITE', 'VILLE', 'REGION', 'PAYS'],
            'StatutDemande'      => ['EN_ATTENTE', 'ACCEPTEE', 'REFUSEE', 'ANNULEE', 'EXPIREE', 'CONCLUE'],
            'StatutReservation'  => ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'REFUSEE'],
            'StatutRapport'      => ['BROUILLON', 'EN_ATTENTE_SIGNATURE', 'SIGNE', 'ANNULE'],
            'StatutPaiement'     => ['EN_ATTENTE', 'PAYEE', 'ECHOUE', 'REMBOURSEE'],
            'ModePaiement'       => ['ESPECES', 'MOBILE_MONEY', 'CARTE', 'VIREMENT'],
            'StatutProfil'       => ['EN_ATTENTE', 'NON_CERTIFIE', 'CERTIFIE', 'REFUSE', 'RETIRE'],
        ];

        foreach ($listes as $type => $valeurs) {
            foreach ($valeurs as $valeur) {
                CodeList::updateOrCreate(
                    ['type' => $type, 'value' => $valeur],
                    ['active' => true]
                );
            }
        }
    }
}