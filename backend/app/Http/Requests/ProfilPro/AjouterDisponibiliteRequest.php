<?php

namespace App\Http\Requests\ProfilPro;

use Illuminate\Foundation\Http\FormRequest;

class AjouterDisponibiliteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'jour_disponibilite' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'heure_debut'        => ['required', 'date_format:H:i'],
            'heure_fin'          => ['required', 'date_format:H:i', 'after:heure_debut'],
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