<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'profil_professionnel_id', 'domaine_id', 'nom', 'description',
        'prix', 'duree', 'unite_tarif', 'est_actif',
    ];

    protected function casts(): array
    {
        return [
            'prix'      => 'decimal:2',
            'duree'     => 'integer',
            'est_actif' => 'boolean',
        ];
    }

    // Le service est proposé par un prestataire
    public function profilProfessionnel(): BelongsTo
    {
        return $this->belongsTo(ProfilProfessionnel::class);
    }

    // Le service appartient à un domaine
    public function domaine(): BelongsTo
    {
        return $this->belongsTo(Domaine::class);
    }
}