<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Paiement extends Model
{
    protected $fillable = [
        'reservation_id', 'montant', 'mode_id', 'statut_id', 'reference_transaction', 'date_paiement',
    ];

    protected function casts(): array
    {
        return [
            'montant'       => 'decimal:2',
            'date_paiement' => 'datetime',
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

   
    public function mode(): BelongsTo
    {
        return $this->belongsTo(CodeList::class, 'mode_id');
    }

   
    public function statut(): BelongsTo
    {
        return $this->belongsTo(CodeList::class, 'statut_id');
    }

    public function facture(): HasOne
        {
            return $this->hasOne(Facture::class);
        }
}