<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Domaine extends Model
{
    protected $fillable = ['libelle', 'description', 'image_path'];

    // Un domaine regroupe plusieurs services
    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    // Un domaine est concerné par plusieurs demandes
public function demandes(): HasMany
{
    return $this->hasMany(DemandeService::class);
}
}