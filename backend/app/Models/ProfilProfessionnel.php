<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProfilProfessionnel extends Model
{
    use HasFactory;

    
    protected $table = 'profils_professionnels';

    protected $fillable = [
        'membre_id', 'titre_professionnel', 'experience', 'cv', 'linkedin', 'portfolio',
        'rayon_intervention_id', 'statut_certification_id', 'note_moyenne', 'biographie',
    ];

    protected function casts(): array
    {
        return ['note_moyenne' => 'decimal:2'];
    }

    
    public function membre(): BelongsTo
    {
        return $this->belongsTo(Membre::class);
    }

    // Son rayon d'intervention (CodeList RayonIntervention)
    public function rayonIntervention(): BelongsTo
    {
        return $this->belongsTo(CodeList::class, 'rayon_intervention_id');
    }

    // Son statut de certification (CodeList StatutProfil)
    public function statutCertification(): BelongsTo
    {
        return $this->belongsTo(CodeList::class, 'statut_certification_id');
    }

            
        public function services(): HasMany
        {
            return $this->hasMany(Service::class);
        }

                
        public function disponibilites(): HasMany
        {
            return $this->hasMany(Disponibilite::class);
        }
}