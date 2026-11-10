<?php

namespace App\Http\Requests\Geo;

use Illuminate\Foundation\Http\FormRequest;

class RecommandationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
           
            'lat'     => ['nullable', 'required_with:lng', 'numeric', 'between:12,17'],
            'lng'     => ['nullable', 'required_with:lat', 'numeric', 'between:-18,-11'],
            'domaine' => ['nullable', 'integer', 'exists:domaines,id'],
            'limite'  => ['nullable', 'integer', 'between:1,30'],
        ];
    }

    public function messages(): array
    {
        return [
            'lat.required_with' => 'La latitude et la longitude doivent être envoyées ensemble.',
            'lng.required_with' => 'La latitude et la longitude doivent être envoyées ensemble.',
            'lat.between'       => 'La position doit se trouver au Sénégal.',
            'lng.between'       => 'La position doit se trouver au Sénégal.',
        ];
    }
}