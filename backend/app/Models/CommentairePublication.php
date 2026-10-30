<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommentairePublication extends Model
{
    protected $table = 'commentaires_publication';

    protected $fillable = ['publication_id', 'membre_id', 'parent_id', 'contenu'];

    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(Membre::class, 'membre_id');
    }

    
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

  
    public function reponses(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->oldest();
    }
}