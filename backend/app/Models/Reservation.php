<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reservation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'membre_id', 'profil_professionnel_id', 'demande_service_id',
        'date_prevue', 'heure_prevue', 'adresse_intervention', 'prix_final', 'statut_id',
        'date_confirmation', 'date_annulation', 'raison_annulation',
    ];

    protected function casts(): array
    {
        return [
            'date_prevue'       => 'date',
            'prix_final'        => 'decimal:2',
            'date_confirmation' => 'datetime',
            'date_annulation'   => 'datetime',
        ];
    }

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    
    public function client(): BelongsTo
    {
        return $this->belongsTo(Membre::class, 'membre_id');
    }

    // Le prestataire qui assure la prestation
    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(ProfilProfessionnel::class, 'profil_professionnel_id');
    }


    public function demande(): BelongsTo
    {
        return $this->belongsTo(DemandeService::class, 'demande_service_id');
    }

    public function statut(): BelongsTo
    {
        return $this->belongsTo(CodeList::class, 'statut_id');
    }


    public function estDirecte(): bool
    {
        return $this->demande_service_id === null;
    }

        
        public function details(): HasMany
        {
            return $this->hasMany(DetailsReservation::class);
        }

        
        public function calculerPrixTotal(): float
        {
            return (float) $this->details()->sum('prix_service');
        }
}