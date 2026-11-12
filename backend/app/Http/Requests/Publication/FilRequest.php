<?php

namespace App\Http\Requests\Publication;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'onglet' => ['nullable', Rule::in(['pour-vous', 'mes-prestataires', 'pres'])],
           
            'lat'    => ['nullable', 'required_with:lng', 'numeric', 'between:12,17'],
            'lng'    => ['nullable', 'required_with:lat', 'numeric', 'between:-18,-11'],
            'rayon'  => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'onglet.in'   => "L'onglet doit être pour-vous, mes-prestataires ou pres.",
            'lat.between' => 'La position doit se trouver au Sénégal.',
            'lng.between' => 'La position doit se trouver au Sénégal.',
        ];
    }
}