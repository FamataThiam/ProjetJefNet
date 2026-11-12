<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Domaine extends Model
{
    protected $fillable = ['libelle', 'description', 'image_path', 'est_actif'];
    
     protected function casts(): array
    {
        return [
            'est_actif' => 'boolean',
        ];
    }

   
    public function scopeActifs($query)
    {
        return $query->where('est_actif', true);
    }


    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

  
        public function demandes(): HasMany
        {
            return $this->hasMany(DemandeService::class);
        }

        public function detailsReservation(): HasMany
        {
            return $this->hasMany(DetailsReservation::class);
        }


        
}