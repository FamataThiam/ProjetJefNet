<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Avis extends Model
{
   
    protected $table = 'avis';

    protected $fillable = ['reservation_id', 'note', 'commentaire'];

    protected function casts(): array
    {
        return ['note' => 'integer'];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}