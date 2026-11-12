<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $fillable = [
        'nom', 'prenom', 'email', 'password',
        'provider', 'provider_id', 'statut_compte_id', 'est_email_verifie',
        'motif_blocage', 'bloque_le', 'bloque_par',
    ];

    
    protected $hidden = ['password', 'remember_token', 'provider_id'];

    protected function casts(): array
    {
        return [
            'password'          => 'hashed',
            'est_email_verifie' => 'boolean',
            'bloque_le' => 'datetime',
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

    
    public function statutCompte(): BelongsTo
    {
        return $this->belongsTo(CodeList::class, 'statut_compte_id');
    }

    
        public function membre(): HasOne
        {
            return $this->hasOne(Membre::class);
        }

       
        public function administrateur(): HasOne
        {
            return $this->hasOne(Administrateur::class);
        }


                
        public function bloquePar(): BelongsTo
        {
            return $this->belongsTo(Administrateur::class, 'bloque_par');
        }

        
        public function estMembre(): bool
        {
            return $this->membre()->exists();
        }

        public function estAdministrateur(): bool
        {
            return $this->administrateur()->exists();
        }
}