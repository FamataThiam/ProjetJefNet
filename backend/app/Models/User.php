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
    ];

    
    protected $hidden = ['password', 'remember_token', 'provider_id'];

    protected function casts(): array
    {
        return [
            'password'          => 'hashed',
            'est_email_verifie' => 'boolean',
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

    // Un utilisateur peut être un membre (héritage)
        public function membre(): HasOne
        {
            return $this->hasOne(Membre::class);
        }

        // Un utilisateur peut être un administrateur (héritage)
        public function administrateur(): HasOne
        {
            return $this->hasOne(Administrateur::class);
        }

        // Raccourcis pratiques pour savoir quel type d'utilisateur c'est
        public function estMembre(): bool
        {
            return $this->membre()->exists();
        }

        public function estAdministrateur(): bool
        {
            return $this->administrateur()->exists();
        }
}