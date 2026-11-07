<?php

namespace App\Http\Requests\Prestataire;

use Illuminate\Foundation\Http\FormRequest;

class RechercherPrestatairesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'domaine'  => ['nullable', 'integer', 'exists:domaines,id'],
            'ville'    => ['nullable', 'string', 'max:100'],
            'note_min' => ['nullable', 'numeric', 'between:0,5'],
            'certifie' => ['nullable', 'boolean'],
            'q' => ['nullable', 'string', 'max:100'],
            'tri'=> ['nullable', 'in:note,prix,avis'],
            'page'=> ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'domaine.exists' => "Ce domaine n'existe pas.",
            'note_min.between' => 'La note minimale doit être comprise entre 0 et 5.',
            'tri.in' => 'Tri possible : note, prix ou avis.',
        ];
    }
}