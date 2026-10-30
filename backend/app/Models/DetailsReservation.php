<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetailsReservation extends Model
{
    protected $table = 'details_reservation';

    protected $fillable = ['reservation_id', 'service_id', 'prix_service'];

    protected function casts(): array
    {
        return ['prix_service' => 'decimal:2'];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}