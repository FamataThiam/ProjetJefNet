<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;



class Media extends Model
{

    use HasFactory;
    protected $table = 'medias';

    protected $fillable = ['publication_id', 'type_id', 'url', 'ordre'];

    public function publication(): BelongsTo
    {
        return $this->belongsTo(Publication::class);
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(CodeList::class, 'type_id');
    }


     public function tousCommentaires(): HasMany
    {
        return $this->hasMany(CommentairePublication::class);
    }
}