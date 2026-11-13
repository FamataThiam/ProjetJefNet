<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\DiffuseEnDirect;


class Avis extends Model
{
   use HasFactory, DiffuseEnDirect;
    protected $table = 'avis';

    protected $fillable = ['reservation_id', 'note', 'commentaire'];

    protected string $ressourceTempsReel = 'avis';
    protected bool $diffusionPublique = true;

    public function membresConcernes(): array
    {
        $reservation = $this->reservation;

        return [$reservation?->client?->id, $reservation?->prestataire?->membre_id];
    }
   

    protected function casts(): array
    {
        return ['note' => 'integer'];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}