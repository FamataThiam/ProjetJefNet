<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Facture extends Model
{
    protected $fillable = ['paiement_id', 'numero_facture', 'date_emission', 'montant', 'fichier_pdf'];

    protected function casts(): array
    {
        return [
            'date_emission' => 'date',
            'montant'       => 'decimal:2',
        ];
    }

    public function paiement(): BelongsTo
    {
        return $this->belongsTo(Paiement::class);
    }

   
    public static function prochainNumero(int $annee): string
    {
        $dernier = static::where('numero_facture', 'like', "JEF-$annee-%")->max('numero_facture');
        $suivant = $dernier ? ((int) substr($dernier, -4)) + 1 : 1;

        return sprintf('JEF-%d-%04d', $annee, $suivant);
    }
}