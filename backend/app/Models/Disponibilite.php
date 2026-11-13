<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\DiffuseEnDirect;


class Disponibilite extends Model
{
    use HasFactory, DiffuseEnDirect;

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


        protected string $ressourceTempsReel = 'disponibilites';
    protected bool $diffusionPublique = true;

    public function membresConcernes(): array
    {
        return [ProfilProfessionnel::whereKey($this->profil_professionnel_id)->value('membre_id')];
    }

    public function profilProfessionnel(): BelongsTo
    {
        return $this->belongsTo(ProfilProfessionnel::class);
    }
}