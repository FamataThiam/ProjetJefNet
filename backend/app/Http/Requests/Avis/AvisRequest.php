<?php

namespace App\Http\Requests\Avis;

use Illuminate\Foundation\Http\FormRequest;

class AvisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Laisser un avis : tout est obligatoire. Modifier : on envoie seulement ce qui change.
        $obligatoire = $this->routeIs('avis.laisser') ? 'required' : 'sometimes';

        return [
            'note'        => [$obligatoire, 'integer', 'between:1,5'],
            'commentaire' => [$obligatoire, 'string', 'min:10', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'note.required'        => 'Donnez une note de 1 à 5 étoiles.',
            'note.between'         => 'La note doit être comprise entre 1 et 5.',
            'commentaire.required' => 'Expliquez votre note en quelques mots.',
            'commentaire.min'      => 'Le commentaire doit contenir au moins 10 caractères.',
            'commentaire.max'      => 'Le commentaire ne doit pas dépasser 1 000 caractères.',
        ];
    }
}