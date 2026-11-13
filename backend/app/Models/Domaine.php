<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\DiffuseEnDirect;


class Domaine extends Model
{


    use HasFactory, DiffuseEnDirect;
     protected $table = 'domaines';
     protected $primaryKey = 'id';
     public $incrementing = true;
     protected $keyType = 'int';
    protected $fillable = ['libelle', 'description', 'image_path', 'est_actif'];
    protected string $ressourceTempsReel = 'domaines';
    protected bool $diffusionPublique = true;
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