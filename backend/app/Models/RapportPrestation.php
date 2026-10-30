<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RapportPrestation extends Model
{
    protected $table = 'rapports_prestation';

    protected $fillable = [
        'reservation_id', 'description_prestation', 'observations', 'photos_avant', 'photos_apres',
        'date_signature_client', 'date_signature_prestataire', 'statut_rapport_id', 'fichier_pdf',
    ];

    protected function casts(): array
    {
        return [
            'date_signature_client'      => 'datetime',
            'date_signature_prestataire' => 'datetime',
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function statut(): BelongsTo
    {
        return $this->belongsTo(CodeList::class, 'statut_rapport_id');
    }

   
    public function numero(): string
    {
        return 'RP-' . $this->created_at->format('Y') . '-' . str_pad($this->id, 4, '0', STR_PAD_LEFT);
    }

   
    public function estSigneParLesDeux(): bool
    {
        return $this->date_signature_client !== null && $this->date_signature_prestataire !== null;
    }
}