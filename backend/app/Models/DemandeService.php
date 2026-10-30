<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DemandeService extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'demandes_service';

    protected $fillable = [
        'membre_id', 'domaine_id', 'titre', 'description',
        'adresse', 'latitude', 'longitude', 'statut_id',
    ];

    protected function casts(): array
    {
        return [
            'latitude'  => 'decimal:7',
            'longitude' => 'decimal:7',
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

    
    public function membre(): BelongsTo
    {
        return $this->belongsTo(Membre::class);
    }

    
    public function domaine(): BelongsTo
    {
        return $this->belongsTo(Domaine::class);
    }

    
    public function statut(): BelongsTo
    {
        return $this->belongsTo(CodeList::class, 'statut_id');
    }

            public function reservation(): HasOne
        {
            return $this->hasOne(Reservation::class);
        }
}