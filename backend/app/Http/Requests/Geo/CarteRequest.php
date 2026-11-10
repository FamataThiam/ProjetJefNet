<?php

namespace App\Http\Requests\Geo;

use Illuminate\Foundation\Http\FormRequest;

class CarteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lat'     => ['required', 'numeric', 'between:12,17'],
            'lng'     => ['required', 'numeric', 'between:-18,-11'],
            'rayon'   => ['nullable', 'numeric', 'between:1,50'],            // en km (10 par défaut)
            'domaine' => ['nullable', 'integer', 'exists:domaines,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'lat.required'  => 'Indiquez votre position (latitude).',
            'lng.required'  => 'Indiquez votre position (longitude).',
            'lat.between'   => 'La position doit se trouver au Sénégal.',
            'lng.between'   => 'La position doit se trouver au Sénégal.',
            'rayon.between' => 'Le rayon de recherche doit être compris entre 1 et 50 km.',
        ];
    }
}