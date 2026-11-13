<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Concerns\DiffuseEnDirect;

class Service extends Model
{
    use HasFactory, DiffuseEnDirect;

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

    protected string $ressourceTempsReel = 'services';
    protected bool $diffusionPublique = true;

    public function membresConcernes(): array
    {
        return [ProfilProfessionnel::whereKey($this->profil_professionnel_id)->value('membre_id')];
    }

    public function profilProfessionnel(): BelongsTo
    {
        return $this->belongsTo(ProfilProfessionnel::class);
    }

    // Le service appartient à un domaine
    public function domaine(): BelongsTo
    {
        return $this->belongsTo(Domaine::class);
    }

            public function detailsReservation(): HasMany
        {
            return $this->hasMany(DetailsReservation::class);
        }
}