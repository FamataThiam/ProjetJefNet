<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = ['membre_id', 'type_id', 'titre', 'contenu', 'lien', 'est_lu'];

    protected function casts(): array
    {
        return ['est_lu' => 'boolean'];
    }

    public function membre(): BelongsTo { return $this->belongsTo(Membre::class); }
    public function type(): BelongsTo   { return $this->belongsTo(CodeList::class, 'type_id'); }
}