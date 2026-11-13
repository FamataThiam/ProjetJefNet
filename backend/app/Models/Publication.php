<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\DiffuseEnDirect;

class Publication extends Model
{

    use HasFactory, DiffuseEnDirect;
    protected $fillable = ['profil_professionnel_id', 'titre', 'description', 'date_publication', 'est_active'];

    protected string $ressourceTempsReel = 'publications';
    protected bool $diffusionPublique = true;

    public function membresConcernes(): array
    {
        return [$this->prestataire?->membre_id];
    }
    

    protected function casts(): array
    {
        return [
            'date_publication' => 'datetime',
            'est_active'       => 'boolean',
        ];
    }

    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(ProfilProfessionnel::class, 'profil_professionnel_id');
    }

    public function medias(): HasMany
    {
        return $this->hasMany(Media::class)->orderBy('ordre');
    }


    public function commentaires(): HasMany
    {
        return $this->hasMany(CommentairePublication::class)->whereNull('parent_id');
    }


    public function scopeVisibles(Builder $q): Builder
    {
        return $q->where('est_active', true);
    }

    public function scopeStories(Builder $q): Builder
    {
        return $q->visibles()->where('date_publication', '>=', now()->subDay());
    }


        
    public function tousCommentaires(): HasMany
    {
        return $this->hasMany(CommentairePublication::class);
    }
}