<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasUuids;

    protected $fillable = ['initiateur_id', 'destinataire_id', 'statut_id'];

    public function uniqueIds(): array { return ['uuid']; }
    public function getRouteKeyName(): string { return 'uuid'; }

    public function initiateur(): BelongsTo   { return $this->belongsTo(Membre::class, 'initiateur_id'); }
    public function destinataire(): BelongsTo { return $this->belongsTo(Membre::class, 'destinataire_id'); }
    public function statut(): BelongsTo       { return $this->belongsTo(CodeList::class, 'statut_id'); }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->oldest();
    }

   
    public function interlocuteur(Membre $moi): Membre
    {
        return $this->initiateur_id === $moi->id ? $this->destinataire : $this->initiateur;
    }
}