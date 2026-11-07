<?php

namespace App\Http\Requests\ProfilPro;

use Illuminate\Foundation\Http\FormRequest;

class ModifierDisponibiliteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'jour_disponibilite' => ['sometimes', 'required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'heure_debut'        => ['sometimes', 'required', 'date_format:H:i'],
            'heure_fin'          => ['sometimes', 'required', 'date_format:H:i'],
        ];
    }

    public function attributes(): array
    {
        return [
            'jour_disponibilite' => 'jour',
            'heure_debut'        => 'heure de début',
            'heure_fin'          => 'heure de fin',
        ];
    }

        public function messages(): array
    {
        return [
            'jour_disponibilite.after_or_equal' => "Le jour doit être aujourd'hui ou une date future.",
        ];
    }
}