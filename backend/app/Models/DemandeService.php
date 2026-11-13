<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Concerns\DiffuseEnDirect;



class DemandeService extends Model
{
    use HasFactory, HasUuids, DiffuseEnDirect;

    protected $table = 'demandes_service';
    protected string $ressourceTempsReel = 'demandes';
    protected bool $diffusionPublique = true;

    public function membresConcernes(): array
    {
        return [$this->membre_id];
    }

    protected $fillable = [
        'membre_id', 'domaine_id', 'titre', 'description',
        'adresse', 'ville', 'localite', 'latitude', 'longitude', 'statut_id',
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