<?php

namespace App\Http\Requests\ProfilPro;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ModifierProfilProRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // « sometimes » : la règle ne s'applique que si le champ est envoyé
            'titre_professionnel' => ['sometimes', 'required', 'string', 'max:100'],
            'experience'          => ['sometimes', 'nullable', 'string', 'max:100'],
            'biographie'          => ['sometimes', 'nullable', 'string', 'max:2000'],
            'linkedin'            => ['sometimes', 'nullable', 'url:https', 'max:255'],
            'portfolio'           => ['sometimes', 'nullable', 'url:http,https', 'max:255'],
            'rayon_intervention'  => [
                'sometimes',
                'required',
                Rule::exists('code_lists', 'value')
                    ->where('type', 'RayonIntervention')
                    ->where('active', true),
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'titre_professionnel' => 'titre professionnel',
            'experience'          => 'expérience',
            'rayon_intervention'  => "rayon d'intervention",
        ];
    }
}