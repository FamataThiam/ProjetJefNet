<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}