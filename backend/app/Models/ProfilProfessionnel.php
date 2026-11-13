<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use App\Models\Concerns\DiffuseEnDirect;

class ProfilProfessionnel extends Model
{
    use HasFactory, DiffuseEnDirect;

    protected $table = 'profils_professionnels';

    protected $fillable = [
        'membre_id', 'titre_professionnel', 'experience', 'cv', 'linkedin', 'portfolio',
        'rayon_intervention_id', 'statut_certification_id', 'note_moyenne', 'biographie',
        'latitude', 'longitude', 'position_maj_le',
        'certification_traitee_par', 'certification_traitee_le', 'motif_refus',
        'certification_demandee_le',
    ];

    protected function casts(): array
    {
        return [
            'note_moyenne'    => 'decimal:2',
            'latitude'   => 'float',
            'longitude'       => 'float',
            'position_maj_le' => 'datetime',
            'certification_traitee_le' => 'datetime',
            'certification_demandee_le' => 'datetime',
        ];
    }
    protected string $ressourceTempsReel = 'prestataires';
    protected bool $diffusionPublique = true;

    public function membresConcernes(): array
    {
        return [$this->membre_id];
    }

    public function membre(): BelongsTo
    {
        return $this->belongsTo(Membre::class);
    }

    public function rayonIntervention(): BelongsTo
    {
        return $this->belongsTo(CodeList::class, 'rayon_intervention_id');
    }

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

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function avis(): HasManyThrough
    {
        return $this->hasManyThrough(Avis::class, Reservation::class);
    }

    public function recalculerNoteMoyenne(): void
    {
        $this->update(['note_moyenne' => round($this->avis()->avg('note') ?? 0, 2)]);
    }

    public function publications(): HasMany
    {
        return $this->hasMany(Publication::class);
    }

        public function traiteePar(): BelongsTo
    {
        return $this->belongsTo(Administrateur::class, 'certification_traitee_par');
    }
}