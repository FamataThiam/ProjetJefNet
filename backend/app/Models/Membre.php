<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Membre extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'username', 'telephone', 'ville', 'localite', 'pays',
        'derniere_connexion', 'nombre_connexion', 'photo_profil_path',
        'couleur_perso', 'signature_electronique',
    ];

    protected function casts(): array
    {
        return [
            'derniere_connexion' => 'datetime',
            'nombre_connexion'   => 'integer',
        ];
    }

    // Un membre appartient à un utilisateur (héritage)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }


            // Un membre peut avoir un profil professionnel (prestataire)
        public function profilProfessionnel(): HasOne
        {
            return $this->hasOne(ProfilProfessionnel::class);
        }

        // Raccourci pour savoir si le membre est prestataire (possède un profil professionnel)
        public function estPrestataire(): bool
        {
            return $this->profilProfessionnel()->exists();
        }

        public function demandes(): HasMany
        {
            return $this->hasMany(DemandeService::class);
        }

        public function reservations(): HasMany
            {
                return $this->hasMany(Reservation::class);
            }
}