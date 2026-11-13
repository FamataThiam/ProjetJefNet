<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;



class Administrateur extends Model
{
    use HasFactory;
    protected $fillable = ['user_id', 'niveau_acces_id', 'date_nomination'];

    protected function casts(): array
    {
        return ['date_nomination' => 'date'];
    }

   
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    
    public function niveauAcces(): BelongsTo
    {
        return $this->belongsTo(CodeList::class, 'niveau_acces_id');
    }
}