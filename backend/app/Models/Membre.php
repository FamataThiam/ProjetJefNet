<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

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


            // Un membre peut avoir un profil professionnel (0..1) : il est alors prestataire
        public function profilProfessionnel(): HasOne
        {
            return $this->hasOne(ProfilProfessionnel::class);
        }

        // Raccourci : est-ce que ce membre est prestataire ?
        public function estPrestataire(): bool
        {
            return $this->profilProfessionnel()->exists();
        }
}