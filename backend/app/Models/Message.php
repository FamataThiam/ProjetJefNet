<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $fillable = ['conversation_id', 'expediteur_id', 'reponse_a_id', 'contenu', 'type_message_id', 'fichier_url', 'est_lu'];

    protected function casts(): array
    {
        return ['est_lu' => 'boolean'];
    }

    public function conversation(): BelongsTo { return $this->belongsTo(Conversation::class); }
    public function expediteur(): BelongsTo   { return $this->belongsTo(Membre::class, 'expediteur_id'); }
    public function type(): BelongsTo         { return $this->belongsTo(CodeList::class, 'type_message_id'); }

   
    public function reponseA(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reponse_a_id');
    }
}