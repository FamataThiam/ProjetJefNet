<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
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
}