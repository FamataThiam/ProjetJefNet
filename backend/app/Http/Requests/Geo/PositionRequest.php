<?php

namespace App\Http\Requests\Geo;

use Illuminate\Foundation\Http\FormRequest;

class PositionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
          
            'latitude'  => ['required', 'numeric', 'between:12,17'],
            'longitude' => ['required', 'numeric', 'between:-18,-11'],
        ];
    }

    public function messages(): array
    {
        return [
            'latitude.between'  => 'La position doit se trouver au Sénégal.',
            'longitude.between' => 'La position doit se trouver au Sénégal.',
        ];
    }
}