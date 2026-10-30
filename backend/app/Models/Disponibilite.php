<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Disponibilite extends Model
{
    protected $fillable = [
        'profil_professionnel_id', 'jour_disponibilite', 'heure_debut', 'heure_fin', 'est_disponible',
    ];

    protected function casts(): array
    {
        return [
            'jour_disponibilite' => 'date',
            'est_disponible'     => 'boolean',
        ];
    }

    public function profilProfessionnel(): BelongsTo
    {
        return $this->belongsTo(ProfilProfessionnel::class);
    }
}