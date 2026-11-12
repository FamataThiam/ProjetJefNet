<?php

namespace App\Http\Requests\Demande;
use Illuminate\Validation\Rule;

use Illuminate\Foundation\Http\FormRequest;

class PublierDemandeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'domaine_id'  => ['required', 'integer', Rule::exists('domaines', 'id')->where('est_actif', true)],
            'titre'       => ['required', 'string', 'max:150'],
            'description' => ['required', 'string', 'max:2000'],
            'adresse'     => ['required', 'string', 'max:255'],   
            'ville'       => ['required', 'string', 'max:100'],
            'localite'    => ['nullable', 'string', 'max:100'],
       
            'latitude'    => ['required', 'numeric', 'between:12,17'],
            'longitude'   => ['required', 'numeric', 'between:-18,-11'],
        ];
    }

    public function attributes(): array
    {
        return [
            'domaine_id' => 'domaine',
            'localite'   => 'localité',
        ];
    }

    public function messages(): array
    {
        return [
            'latitude.between'  => 'La position doit se trouver au Sénégal.',
            'longitude.between' => 'La position doit se trouver au Sénégal.',
            'domaine_id.exists' => "Ce domaine n'existe pas ou n'est plus proposé sur JefNet.",
        ];
    }
}