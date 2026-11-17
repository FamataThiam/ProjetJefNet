<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\DiffuseEnDirect;

class CodeList extends Model
{
    use HasFactory, DiffuseEnDirect;

    protected $fillable = ['type', 'value', 'description', 'active'];

    protected $casts = ['active' => 'boolean'];

    
    public const VALEURS_SYSTEME = [
        'StatutCompte'       => ['ACTIF', 'INACTIF', 'BLOQUE', 'SIGNALE'],
        'NiveauAcces'        => ['SUPER_ADMIN', 'ADMIN', 'MODERATEUR'],
        'TypeNotification'   => ['RESERVATION', 'NOUVELLE_DEMANDE', 'PAIEMENT', 'AVIS', 'PUBLICATION', 'PROFIL', 'MESSAGE', 'CERTIFICATION', 'COMPTE'],
        'StatutConversation' => ['ACTIVE', 'ARCHIVEE'],
        'TypeMessage'        => ['TEXTE', 'IMAGE', 'AUDIO', 'VIDEO', 'FICHIER', 'APPEL_VIDEO'],
        'TypeMedia'          => ['IMAGE', 'VIDEO'],
        'RayonIntervention'  => ['LOCALITE', 'VILLE', 'REGION', 'PAYS'],
        'StatutDemande'      => ['EN_ATTENTE', 'ACCEPTEE', 'REFUSEE', 'ANNULEE', 'EXPIREE', 'CONCLUE'],
        'StatutReservation'  => ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'REFUSEE'],
        'StatutRapport'      => ['BROUILLON', 'EN_ATTENTE_SIGNATURE', 'SIGNE', 'ANNULE'],
        'StatutPaiement'     => ['EN_ATTENTE', 'PAYEE', 'ECHOUE', 'REMBOURSEE'],
        'ModePaiement'       => ['ESPECES', 'MOBILE_MONEY', 'CARTE', 'VIREMENT'],
        'StatutProfil'       => ['EN_ATTENTE', 'NON_CERTIFIE', 'CERTIFIE', 'REFUSE', 'RETIRE'],
    ];

   
    public static function types(): array
    {
        return array_keys(self::VALEURS_SYSTEME);
    }


    public function estSysteme(): bool
    {
        return in_array($this->value, self::VALEURS_SYSTEME[$this->type] ?? [], true);
    }
}